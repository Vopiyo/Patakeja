import React, { useState, useEffect, useRef } from "react";
import { X, Check, Smartphone } from "lucide-react";
import { T } from "../data/theme";
import { PLANS } from "../data/plans";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";

const PAYABLE_PLANS = ["standard", "pro"];

export default function UpgradeModal({ currentPlan, onClose, onUpgraded }) {
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("standard");
  const [phone, setPhone] = useState(profile?.phone ? normalizePhone(profile.phone) : "");
  const [stage, setStage] = useState("choose"); // choose | waiting | success | error
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function normalizePhone(raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("254")) return digits;
    if (digits.startsWith("0")) return "254" + digits.slice(1);
    return digits;
  }

  const inputStyle = { width: "100%", padding: "10px 12px", border: `1.5px solid ${T.line}`, background: "#fff", fontFamily: T.body, fontSize: 14, color: T.ink, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: T.head, fontWeight: 600, fontSize: 12, color: T.blue, marginBottom: 5, display: "block", letterSpacing: 0.3 };

  const startPolling = (paymentId) => {
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const { data } = await supabase.from("payments").select("status").eq("id", paymentId).single();
      if (data?.status === "completed") {
        clearInterval(pollRef.current);
        setStage("success");
        onUpgraded();
      } else if (data?.status === "failed") {
        clearInterval(pollRef.current);
        setStage("error");
        setError("The payment didn't go through — you can try again.");
      } else if (attempts > 40) { // ~2 minutes at 3s intervals
        clearInterval(pollRef.current);
        setStage("error");
        setError("Still waiting on confirmation. If you completed the M-Pesa prompt, it may just be delayed — check back shortly, or try again.");
      }
    }, 3000);
  };

  const handlePay = async () => {
    setError("");
    const normalized = normalizePhone(phone);
    if (!/^2547\d{8}$/.test(normalized)) {
      setError("Enter a valid Safaricom number, e.g. 0712345678.");
      return;
    }
    setStage("waiting");
    const { data, error: invokeError } = await supabase.functions.invoke("initiate-payment", {
      body: { plan: selectedPlan, phone: normalized },
    });
    if (invokeError || data?.error) {
      setStage("error");
      setError(data?.error || invokeError.message || "Couldn't start the payment.");
      return;
    }
    startPolling(data.paymentId);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,40,64,0.7)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 12px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `3px solid ${T.navy}`, maxWidth: 480, width: "100%", padding: 24, margin: "30px 0", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: T.navy, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color={T.cream} />
        </button>

        {stage === "success" ? (
          <>
            <h2 style={{ fontFamily: T.display, fontSize: 20, color: T.ink, margin: "0 0 10px" }}>You're upgraded!</h2>
            <p style={{ fontFamily: T.body, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
              Your {PLANS[selectedPlan].label} plan is active. You can post more listings and get better placement right away.
            </p>
            <button onClick={onClose} style={{ marginTop: 10, background: T.navy, color: T.cream, border: "none", padding: "12px 0", width: "100%", fontFamily: T.head, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Done</button>
          </>
        ) : stage === "waiting" ? (
          <>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Smartphone size={36} color={T.blue} style={{ marginBottom: 12 }} />
              <h2 style={{ fontFamily: T.display, fontSize: 18, color: T.ink, margin: "0 0 8px" }}>Check your phone</h2>
              <p style={{ fontFamily: T.body, fontSize: 13.5, color: T.blue, lineHeight: 1.6 }}>
                An M-Pesa prompt should appear on <b>{normalizePhone(phone)}</b> — enter your PIN to complete the {PLANS[selectedPlan].priceLabel} payment.
              </p>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: T.display, fontSize: 20, color: T.ink, margin: "0 0 4px" }}>Upgrade your plan</h2>
            <p style={{ fontFamily: T.body, fontSize: 13, color: T.blue, margin: "0 0 18px" }}>You're currently on <b>{PLANS[currentPlan]?.label || "Free"}</b>.</p>

            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {PAYABLE_PLANS.map((key) => {
                const p = PLANS[key];
                const active = selectedPlan === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key)}
                    style={{ textAlign: "left", padding: 14, border: `2px solid ${active ? T.navy : T.line}`, background: active ? T.paperDark : "#fff", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontFamily: T.head, fontWeight: 700, fontSize: 14, color: T.ink }}>{p.label}</span>
                      <span style={{ fontFamily: T.mono, fontWeight: 600, fontSize: 13, color: T.navy }}>{p.priceLabel}</span>
                    </div>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontFamily: T.body, fontSize: 12.5, color: T.ink }}>
                      {p.features.map((f) => <li key={f}>{f}</li>)}
                    </ul>
                  </button>
                );
              })}
            </div>

            <label style={labelStyle}>M-Pesa phone number</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" />

            {error && <p style={{ color: T.red, fontFamily: T.body, fontSize: 13, margin: "10px 0 0" }}>{error}</p>}

            <button
              onClick={handlePay}
              style={{ marginTop: 16, background: T.red, color: T.cream, border: "none", padding: "13px 0", width: "100%", fontFamily: T.head, fontWeight: 700, fontSize: 14, letterSpacing: 0.4, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Check size={15} /> PAY {PLANS[selectedPlan].priceLabel.toUpperCase()} WITH M-PESA
            </button>
          </>
        )}
      </div>
    </div>
  );
}
