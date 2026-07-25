import React, { useState } from "react";
import { X, Home as HomeIcon, ChevronLeft, ChevronRight, Heart, Phone, MessageCircle, Flag, Trash2 } from "lucide-react";
import { Droplet, Car, ShieldCheck, Wifi } from "lucide-react";
import { T, AMENITY_LABELS, formatKsh, telHref, waHref } from "../data/theme";
import { PriceTag, VerifiedStamp, Pill } from "./shared";
import { useAuth } from "../hooks/useAuth";

const AMENITY_ICON = { water: Droplet, parking: Car, security: ShieldCheck, wifi: Wifi };

export default function ListingModal({ listing, isFav, onToggleFav, onClose, onDelete, onReport }) {
  const { user } = useAuth();
  const [photoIdx, setPhotoIdx] = useState(0);
  if (!listing) return null;

  const photos = listing.photos && listing.photos.length ? listing.photos : null;
  const nextPhoto = (e) => { e.stopPropagation(); setPhotoIdx((i) => (i + 1) % photos.length); };
  const prevPhoto = (e) => { e.stopPropagation(); setPhotoIdx((i) => (i - 1 + photos.length) % photos.length); };
  const isOwner = user && listing.owner_id === user.id;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,40,64,0.7)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 12px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `3px solid ${T.navy}`, maxWidth: 640, width: "100%", position: "relative", margin: "20px 0" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: T.navy, border: "none", borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 3 }}>
          <X size={17} color={T.cream} />
        </button>

        <div
          style={{
            height: 220, display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
            background: photos ? `url(${photos[photoIdx]}) center/cover no-repeat` : "linear-gradient(135deg,#22405F,#2E6B4D)",
          }}
        >
          {!photos && <HomeIcon color="rgba(255,255,255,0.85)" size={50} strokeWidth={1.5} />}
          {photos && photos.length > 1 && (
            <>
              <button onClick={prevPhoto} aria-label="Previous photo" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(21,40,64,0.55)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevronLeft size={18} color="#fff" />
              </button>
              <button onClick={nextPhoto} aria-label="Next photo" style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "rgba(21,40,64,0.55)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <ChevronRight size={18} color="#fff" />
              </button>
              <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(21,40,64,0.55)", color: "#fff", fontFamily: T.mono, fontSize: 11, padding: "3px 10px", borderRadius: 10 }}>
                {photoIdx + 1} / {photos.length}
              </div>
            </>
          )}
          {listing.verified && <div style={{ position: "absolute", top: 10, left: 14, background: T.paper, borderRadius: "50%" }}><VerifiedStamp small /></div>}
        </div>
        {photos && photos.length > 1 && (
          <div style={{ display: "flex", gap: 6, padding: "10px 24px 0", overflowX: "auto" }}>
            {photos.map((p, i) => (
              <div key={i} onClick={() => setPhotoIdx(i)} style={{ width: 56, height: 42, flexShrink: 0, cursor: "pointer", background: `url(${p}) center/cover no-repeat`, border: i === photoIdx ? `2px solid ${T.gold}` : "2px solid transparent", opacity: i === photoIdx ? 1 : 0.7 }} />
            ))}
          </div>
        )}

        <div style={{ padding: "24px 24px 24px" }}>
          <Pill bg={T.navy} color={T.cream}>{listing.size}</Pill>
          <h2 style={{ fontFamily: T.display, fontSize: 22, color: T.ink, margin: "10px 0 4px" }}>{listing.title}</h2>
          <div style={{ fontFamily: T.body, fontSize: 14, color: T.blue }}>{listing.estate}, {listing.city}</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "18px 0" }}>
            <PriceTag amount={listing.price} size="lg" />
            <button onClick={() => onToggleFav(listing.id)} style={{ background: "none", border: `1.5px solid ${T.line}`, borderRadius: 20, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: T.head, fontSize: 12, color: T.ink }}>
              <Heart size={14} color={isFav ? T.red : T.ink} fill={isFav ? T.red : "none"} /> {isFav ? "Saved" : "Save"}
            </button>
          </div>

          <p style={{ fontFamily: T.body, fontSize: 14, color: T.ink, lineHeight: 1.6 }}>{listing.description}</p>
          <p style={{ fontFamily: T.body, fontSize: 13, color: T.blue, marginTop: -8 }}>Deposit: {formatKsh(listing.deposit)} · {listing.no_fee ? "No viewing fee charged" : "Ask about viewing terms"}</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
            {(listing.amenities || []).map((a) => {
              const Icon = AMENITY_ICON[a];
              if (!Icon) return null;
              return <Pill key={a} bg={T.paperDark} color={T.ink} style={{ fontWeight: 500 }}><Icon size={12} /> {AMENITY_LABELS[a]}</Pill>;
            })}
          </div>

          <div style={{ border: `1.5px dashed ${T.line}`, padding: "14px 16px", marginTop: 6 }}>
            <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 12, color: T.blue, marginBottom: 8, letterSpacing: 0.4 }}>NEIGHBOURHOOD SNAPSHOT — community reported</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontFamily: T.body, fontSize: 13, color: T.ink }}>
              <div><b>Distance to CBD:</b> {listing.cbd || "—"}</div>
              <div><b>Nearest stage:</b> {listing.stage || "—"}</div>
              <div><b>Water reliability:</b> {"★".repeat(listing.water_rating || 0)}{"☆".repeat(5 - (listing.water_rating || 0))}</div>
              <div><b>Security rating:</b> {"★".repeat(listing.sec_rating || 0)}{"☆".repeat(5 - (listing.sec_rating || 0))}</div>
            </div>
          </div>

          <div style={{ background: T.paperDark, padding: "14px 16px", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 14, color: T.ink }}>{listing.contact_name}</div>
              <div style={{ fontFamily: T.mono, fontSize: 13, color: T.blue }}>{listing.phone}</div>
              <Pill bg="transparent" color={T.ink} style={{ border: `1.5px solid ${T.line}`, marginTop: 4 }}>{listing.role}</Pill>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <a href={telHref(listing.phone)} style={{ textDecoration: "none" }}>
                <div style={{ background: T.navy, color: T.cream, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontFamily: T.head, fontWeight: 600, fontSize: 13 }}><Phone size={14} /> Call</div>
              </a>
              <a href={waHref(listing.phone, `Hi, I'm interested in "${listing.title}" (${listing.estate}, ${listing.city}) that I saw on PataKeja.`)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <div style={{ background: T.green, color: T.cream, display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", fontFamily: T.head, fontWeight: 600, fontSize: 13 }}><MessageCircle size={14} /> WhatsApp</div>
              </a>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
            <button onClick={() => onReport(listing)} style={{ background: "none", border: "none", color: T.red, fontFamily: T.head, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: 0 }}>
              <Flag size={13} /> Report this listing
            </button>
            {isOwner && (
              <button onClick={() => onDelete(listing)} style={{ background: "none", border: "none", color: T.blue, fontFamily: T.head, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, cursor: "pointer", padding: 0 }}>
                <Trash2 size={13} /> Delete my listing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
