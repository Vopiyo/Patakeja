import React from "react";
import { Heart, Home as HomeIcon, Camera, Phone, MessageCircle } from "lucide-react";
import { T, SIZE_SHORT, AMENITY_LABELS, telHref, waHref } from "../data/theme";
import { PriceTag, VerifiedStamp, Pill } from "./shared";
import { Droplet, Car, ShieldCheck, Wifi } from "lucide-react";

const AMENITY_ICON = { water: Droplet, parking: Car, security: ShieldCheck, wifi: Wifi };

const GRADIENTS = {
  "Bedsitter": "linear-gradient(135deg,#22405F,#2E6B4D)",
  "1 Bedroom": "linear-gradient(135deg,#22405F,#3A5A80)",
  "2 Bedroom": "linear-gradient(135deg,#BE3B2B,#22405F)",
  "3 Bedroom": "linear-gradient(135deg,#D79A3B,#BE3B2B)",
  "4+ Bedroom": "linear-gradient(135deg,#2E6B4D,#D79A3B)",
};

export default function ListingCard({ listing, isFav, onToggleFav, onOpen }) {
  const photos = listing.photos && listing.photos.length ? listing.photos : null;
  return (
    <div style={{ background: T.card, border: `3px solid ${T.navy}`, position: "relative", display: "flex", flexDirection: "column" }} className="listing-card">
      <div style={{ position: "absolute", top: -3, left: 18, width: 10, height: 10, borderRadius: "50%", background: T.ink, border: `2px solid ${T.paper}`, zIndex: 2 }} />

      <div
        onClick={() => onOpen(listing)}
        style={{
          height: 120, position: "relative", cursor: "pointer",
          background: photos ? `linear-gradient(rgba(21,40,64,0.15), rgba(21,40,64,0.35)), url(${photos[0]}) center/cover no-repeat` : GRADIENTS[listing.size],
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {!photos && <HomeIcon color="rgba(255,255,255,0.85)" size={38} strokeWidth={1.5} />}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <Pill bg={T.navy} color={T.cream}>{SIZE_SHORT[listing.size]}</Pill>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(listing.id); }}
          style={{ position: "absolute", top: 8, right: 8, background: "rgba(21,40,64,0.55)", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
          aria-label="Save listing"
        >
          <Heart size={16} color={isFav ? T.red : "#fff"} fill={isFav ? T.red : "none"} />
        </button>
        {photos && photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 8, right: 10, background: "rgba(21,40,64,0.65)", color: "#fff", borderRadius: 12, padding: "3px 9px", display: "flex", alignItems: "center", gap: 4, fontFamily: T.mono, fontSize: 11 }}>
            <Camera size={11} /> {photos.length}
          </div>
        )}
        {listing.verified && (
          <div style={{ position: "absolute", bottom: -20, left: 10, background: T.paper, borderRadius: "50%" }}>
            <VerifiedStamp small />
          </div>
        )}
      </div>

      <div style={{ padding: "18px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <h3 style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, color: T.ink, margin: 0, cursor: "pointer" }} onClick={() => onOpen(listing)}>
            {listing.title}
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: T.blue, fontFamily: T.body, fontSize: 13, marginTop: 4 }}>
            {listing.estate}, {listing.city}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(listing.amenities || []).map((a) => {
            const Icon = AMENITY_ICON[a];
            if (!Icon) return null;
            return <Pill key={a} bg={T.paperDark} color={T.ink} style={{ fontWeight: 500 }}><Icon size={11} /> {AMENITY_LABELS[a]}</Pill>;
          })}
          {listing.no_fee && <Pill bg="rgba(46,107,77,0.15)" color={T.green}>No viewing fee</Pill>}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
          <PriceTag amount={listing.price} />
          <Pill bg="transparent" color={T.ink} style={{ border: `1.5px solid ${T.line}` }}>{listing.role}</Pill>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <a href={telHref(listing.phone)} style={{ flex: 1, textDecoration: "none" }}>
            <div style={{ background: T.navy, color: T.cream, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", fontFamily: T.head, fontWeight: 600, fontSize: 13 }}>
              <Phone size={14} /> Call
            </div>
          </a>
          <a href={waHref(listing.phone, `Hi, I'm interested in "${listing.title}" (${listing.estate}, ${listing.city}) that I saw on PataKeja.`)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: "none" }}>
            <div style={{ background: T.green, color: T.cream, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", fontFamily: T.head, fontWeight: 600, fontSize: 13 }}>
              <MessageCircle size={14} /> WhatsApp
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
