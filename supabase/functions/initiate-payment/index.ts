// supabase/functions/initiate-payment/index.ts
//
// Called from the client (via supabase.functions.invoke) when a
// signed-in user picks a paid plan. Responsibilities:
//   1. Verify who's calling (from their auth JWT — never trust a
//      user_id passed in the request body).
//   2. Look up the price SERVER-SIDE — never trust a price/amount
//      sent by the client.
//   3. Log a "pending" row in `payments`.
//   4. Call IntaSend's M-Pesa STK Push endpoint so the user gets
//      a payment prompt on their phone.
//   5. Return the reference so the client can show a
//      "check your phone" state and poll for the result.
//
// The actual plan upgrade happens later, in intasend-webhook,
// once IntaSend confirms the payment succeeded — never here.
//
// Deploy with:
//   supabase functions deploy initiate-payment
// Required secrets (supabase secrets set KEY=value):
//   INTASEND_SECRET_KEY   — from your IntaSend dashboard (server-side only, never in the browser)
//   INTASEND_ENV          — "sandbox" or "live" (defaults to sandbox)
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.

import { createClient } from "npm:@supabase/supabase-js@2";

// Server-side source of truth for prices — matches the pricing
// discussed in the app, but this is the ONLY place that actually
// controls what gets charged. Update here if you change pricing.
const PLAN_PRICES: Record<string, number> = {
  standard: 300,
  pro: 1000,
};

const INTASEND_ENV = Deno.env.get("INTASEND_ENV") ?? "sandbox";
const INTASEND_BASE_URL =
  INTASEND_ENV === "live"
    ? "https://payment.intasend.com/api/v1"
    : "https://sandbox.intasend.com/api/v1";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), { status: 401 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Identify the caller from their JWT — this is the only user_id we trust.
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), { status: 401 });
    }
    const user = userData.user;

    const { plan, phone } = await req.json();
    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return new Response(JSON.stringify({ error: "Unknown plan" }), { status: 400 });
    }
    if (!phone || !/^2547\d{8}$/.test(phone.replace(/\s/g, ""))) {
      return new Response(
        JSON.stringify({ error: "Phone must be in the format 2547XXXXXXXX" }),
        { status: 400 }
      );
    }

    // Fetch the user's profile for the name/email IntaSend wants.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    const [firstName, ...rest] = (profile?.full_name || "PataKeja User").split(" ");
    const lastName = rest.join(" ") || "-";

    // 1. Log the attempt before calling IntaSend, so we have a
    //    record even if the network call fails.
    const { data: paymentRow, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        plan,
        amount,
        phone,
        provider: "intasend",
        status: "pending",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    // 2. Trigger the actual STK Push via IntaSend.
    //    Response shape may differ slightly by IntaSend API
    //    version — check https://developers.intasend.com/reference
    //    if `invoice.invoice_id` below isn't present in your response.
    const intasendRes = await fetch(`${INTASEND_BASE_URL}/payment/mpesa-stk-push/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("INTASEND_SECRET_KEY")}`,
      },
      body: JSON.stringify({
        amount,
        phone_number: phone,
        api_ref: paymentRow.id, // ties the IntaSend transaction back to our payment row
        email: user.email,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    const intasendData = await intasendRes.json();
    if (!intasendRes.ok) {
      await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", paymentRow.id);
      return new Response(
        JSON.stringify({ error: intasendData?.detail || "IntaSend rejected the request" }),
        { status: 502 }
      );
    }

    const providerRef = intasendData?.invoice?.invoice_id || intasendData?.id || null;
    await supabaseAdmin.from("payments").update({ provider_ref: providerRef }).eq("id", paymentRow.id);

    return new Response(
      JSON.stringify({ paymentId: paymentRow.id, providerRef, status: "pending" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Unexpected error initiating payment" }), { status: 500 });
  }
});
