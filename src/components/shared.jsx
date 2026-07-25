import React from "react";
import { ShieldCheck } from "lucide-react";
import { T, formatKsh } from "../data/theme";

/* Signature element: a paper price tag, like one pinned to a signboard listing. */
export function PriceTag({ amount, size = "md" }) {
  const big = size === "lg";
  return (
    <div
      style={{
        background: T.gold,
        color: T.navy,
        fontFamily: T.mono,
        fontWeight: 600,
        fontSize: big ? 22 : 15,
        padding: big ? "10px 20px 10px 26px" : "6px 14px 6px 18px",
        clipPath: "polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)",
        position: "relative",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: big ? 6 : 4,
          top: "50%",
          transform: "translateY(-50%)",
          width: big ? 6 : 5,
          height: big ? 6 : 5,
          borderRadius: "50%",
          background: T.paper,
          border: `1px solid ${T.navy}`,
        }}
      />
      {formatKsh(amount)}
      <span style={{ fontSize: big ? 12 : 10, fontWeight: 500 }}>/mo</span>
    </div>
  );
}

/* Rubber-stamp motif for verified listings. */
export function VerifiedStamp({ small }) {
  return (
    <div
      style={{
        border: `2px dashed ${T.green}`,
        color: T.green,
        borderRadius: "50%",
        width: small ? 54 : 66,
        height: small ? 54 : 66,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        transform: "rotate(-11deg)",
        background: "rgba(46,107,77,0.07)",
        fontFamily: T.head,
        textAlign: "center",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      <ShieldCheck size={small ? 15 : 18} strokeWidth={2.5} />
      <span style={{ fontSize: small ? 7 : 8, fontWeight: 700, marginTop: 2, letterSpacing: 0.5 }}>VERIFIED</span>
    </div>
  );
}

export function Pill({ children, bg, color, style }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontFamily: T.head,
        fontWeight: 600,
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 20,
        letterSpacing: 0.3,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
