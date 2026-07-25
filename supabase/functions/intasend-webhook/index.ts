// supabase/functions/intasend-webhook/index.ts
//
// IntaSend calls this URL when a payment's status changes (set
// this as your webhook URL in the IntaSend dashboard, under
// Settings → Webhooks, with the events for M-Pesa/Collection).
//
// Deploy with:
//   supabase functions deploy intasend-webhook --no-verify-jwt
// (--no-verify-jwt because IntaSend calling in has no Supabase
// user session — we verify the request differently, see below.)
//
// Required secret:
//   INTASEND_WEBHOOK_CHALLENGE — set this to the same "challenge"
//   string you configure in the IntaSend dashboard's webhook
//   settings; IntaSend echoes it back in the payload so you can
//   confirm the call actually came from them. Check IntaSend's
//   current webhook docs for the exact field name/verification
//   method, as this has changed between API versions — treat the
//   check below as a starting point to confirm against their docs.

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.json();

    const expectedChallenge = Deno.env.get("INTASEND_WEBHOOK_CHALLENGE");
    if (expectedChallenge && payload.challenge !== expectedChallenge) {
      return new Response("Invalid challenge", { status: 401 });
    }

    // Expected fields based on IntaSend's collection status webhook —
    // verify against a real payload from your dashboard's webhook
    // logs and adjust these field names if they differ.
    const providerRef = payload.invoice_id || payload.id;
    const state = (payload.state || payload.status || "").toUpperCase(); // e.g. "COMPLETE" / "FAILED"

    if (!providerRef) {
      return new Response("Missing invoice reference", { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: payment, error: findError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("provider_ref", providerRef)
      .single();
    if (findError || !payment) {
      console.error("No matching payment for", providerRef);
      return new Response("Payment not found", { status: 404 });
    }

    if (state === "COMPLETE" || state === "COMPLETED" || state === "SUCCESS") {
      await supabaseAdmin.from("payments").update({ status: "completed" }).eq("id", payment.id);

      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      await supabaseAdmin.from("subscriptions").upsert({
        user_id: payment.user_id,
        plan: payment.plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else if (state === "FAILED" || state === "CANCELLED") {
      await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", payment.id);
    }
    // Any other/unknown state: leave as "pending", IntaSend may call again.

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("Webhook error", { status: 500 });
  }
});
