import React, { useState } from "react";
import { X } from "lucide-react";
import { T } from "../data/theme";
import { useAuth } from "../hooks/useAuth";

export default function AuthModal({ onClose }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Landlord");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmNotice, setConfirmNotice] = useState(false);

  const inputStyle = { width: "100%", padding: "10px 12px", border: `1.5px solid ${T.line}`, background: "#fff", fontFamily: T.body, fontSize: 14, color: T.ink, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: T.head, fontWeight: 600, fontSize: 12, color: T.blue, marginBottom: 5, display: "block", letterSpacing: 0.3 };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn({ email, password });
      setBusy(false);
      if (error) setError(error.message);
      else onClose();
    } else {
      if (!fullName || !phone) {
        setBusy(false);
        setError("Name and phone are required so house hunters can reach you.");
        return;
      }
      const { error, needsEmailConfirmation } = await signUp({ email, password, fullName, phone, role });
      setBusy(false);
      if (error) setError(error.message);
      else if (needsEmailConfirmation) setConfirmNotice(true);
      else onClose();
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,40,64,0.7)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 12px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `3px solid ${T.navy}`, maxWidth: 420, width: "100%", padding: 24, margin: "40px 0", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: T.navy, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color={T.cream} />
        </button>

        {confirmNotice ? (
          <>
            <h2 style={{ fontFamily: T.display, fontSize: 20, color: T.ink, margin: "0 0 10px" }}>Check your email</h2>
            <p style={{ fontFamily: T.body, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>
              We've sent a confirmation link to <b>{email}</b>. Click it, then come back and sign in.
            </p>
          </>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
              <button onClick={() => setMode("signin")} style={{ flex: 1, padding: "9px 0", fontFamily: T.head, fontWeight: 700, fontSize: 13, cursor: "pointer", border: `1.5px solid ${T.navy}`, background: mode === "signin" ? T.navy : "transparent", color: mode === "signin" ? T.cream : T.navy }}>Sign in</button>
              <button onClick={() => setMode("signup")} style={{ flex: 1, padding: "9px 0", fontFamily: T.head, fontWeight: 700, fontSize: 13, cursor: "pointer", border: `1.5px solid ${T.navy}`, background: mode === "signup" ? T.navy : "transparent", color: mode === "signup" ? T.cream : T.navy }}>Create account</button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {mode === "signup" && (
                <>
                  <div>
                    <label style={labelStyle}>Full name</label>
                    <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Jane Wanjiru" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone number</label>
                    <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
                  </div>
                  <div>
                    <label style={labelStyle}>I am a</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {["Landlord", "Agent", "Caretaker", "Hunter"].map((r) => (
                        <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: "9px 0", fontFamily: T.head, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${T.navy}`, background: role === r ? T.navy : "transparent", color: role === r ? T.cream : T.navy }}>{r}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
              </div>

              {error && <p style={{ color: T.red, fontFamily: T.body, fontSize: 13, margin: 0 }}>{error}</p>}

              <button
                disabled={busy}
                onClick={handleSubmit}
                style={{ background: T.red, color: T.cream, border: "none", padding: "13px 0", fontFamily: T.head, fontWeight: 700, fontSize: 14, letterSpacing: 0.4, cursor: busy ? "wait" : "pointer" }}
              >
                {busy ? "Please wait…" : mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
              </button>
              {mode === "signup" && (
                <p style={{ fontFamily: T.body, fontSize: 11.5, color: T.blue, margin: 0 }}>
                  "Hunter" just means you're here to find a house — you can still save favourites without listing anything.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
