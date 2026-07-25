import React, { useState } from "react";
import { X, Check, Upload } from "lucide-react";
import { Droplet, Car, ShieldCheck, Wifi } from "lucide-react";
import { T, SIZES, AMENITY_LABELS } from "../data/theme";
import { useAuth } from "../hooks/useAuth";
import { supabase, PHOTOS_BUCKET } from "../lib/supabaseClient";

const AMENITY_KEYS = ["water", "parking", "security", "wifi"];
const AMENITY_ICON = { water: Droplet, parking: Car, security: ShieldCheck, wifi: Wifi };
const MAX_PHOTOS = 6;

export default function PostModal({ onClose, onPosted }) {
  const { user, profile } = useAuth();
  const [f, setF] = useState({
    title: "", city: "", estate: "", size: SIZES[0], price: "", deposit: "",
    contactName: profile?.full_name || "", role: profile?.role || "Landlord", phone: profile?.phone || "",
    desc: "", noFee: true, amenities: [], photoFiles: [], photoPreviews: [],
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a) => setF((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a] }));

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX_PHOTOS - f.photoFiles.length);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setF((p) => (p.photoFiles.length >= MAX_PHOTOS ? p : {
        ...p, photoFiles: [...p.photoFiles, file], photoPreviews: [...p.photoPreviews, reader.result],
      }));
      reader.readAsDataURL(file);
    });
  };
  const removePhoto = (i) => setF((p) => ({
    ...p, photoFiles: p.photoFiles.filter((_, idx) => idx !== i), photoPreviews: p.photoPreviews.filter((_, idx) => idx !== i),
  }));

  const inputStyle = { width: "100%", padding: "10px 12px", border: `1.5px solid ${T.line}`, background: "#fff", fontFamily: T.body, fontSize: 14, color: T.ink, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: T.head, fontWeight: 600, fontSize: 12, color: T.blue, marginBottom: 5, display: "block", letterSpacing: 0.3 };

  const canSubmit = f.title && f.city && f.estate && f.price && f.contactName && f.phone && !busy;

  const uploadPhotos = async () => {
    const urls = [];
    for (const file of f.photoFiles) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(path, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    setError("");
    setBusy(true);
    try {
      const photoUrls = f.photoFiles.length ? await uploadPhotos() : [];
      const { data, error: insertError } = await supabase.from("listings").insert({
        owner_id: user.id,
        title: f.title,
        city: f.city,
        estate: f.estate,
        size: f.size,
        price: Number(f.price) || 0,
        deposit: Number(f.deposit) || Number(f.price) || 0,
        contact_name: f.contactName,
        role: f.role,
        phone: f.phone,
        verified: false,
        no_fee: f.noFee,
        amenities: f.amenities,
        description: f.desc || "No additional details provided.",
        photos: photoUrls,
      }).select().single();
      if (insertError) throw insertError;
      onPosted(data);
    } catch (err) {
      setError(err.message || "Something went wrong posting your listing.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(21,40,64,0.7)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "24px 12px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.card, border: `3px solid ${T.navy}`, maxWidth: 560, width: "100%", padding: 24, margin: "20px 0", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 14, background: T.navy, border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={16} color={T.cream} />
        </button>
        <h2 style={{ fontFamily: T.display, fontSize: 20, color: T.ink, margin: "0 0 4px" }}>List your house</h2>
        <p style={{ fontFamily: T.body, fontSize: 13, color: T.blue, margin: "0 0 20px" }}>Free to post. No commission. House hunters contact you directly.</p>

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Listing title</label>
            <input style={inputStyle} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder='e.g. "Bright 1BR near stage"' />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Town / City</label>
              <input style={inputStyle} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Nakuru" />
            </div>
            <div>
              <label style={labelStyle}>Estate / Area</label>
              <input style={inputStyle} value={f.estate} onChange={(e) => set("estate", e.target.value)} placeholder="Milimani" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>House size</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {SIZES.map((s) => (
                <button key={s} onClick={() => set("size", s)} style={{ padding: "7px 12px", fontFamily: T.head, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${T.navy}`, background: f.size === s ? T.navy : "transparent", color: f.size === s ? T.cream : T.navy }}>{s}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Rent (Ksh/month)</label>
              <input type="number" style={inputStyle} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="15000" />
            </div>
            <div>
              <label style={labelStyle}>Deposit (Ksh)</label>
              <input type="number" style={inputStyle} value={f.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="15000" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Amenities</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AMENITY_KEYS.map((k) => {
                const Icon = AMENITY_ICON[k];
                return (
                  <button key={k} onClick={() => toggleAmenity(k)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", fontFamily: T.head, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${T.line}`, background: f.amenities.includes(k) ? T.paperDark : "transparent", color: T.ink }}>
                    <Icon size={13} /> {AMENITY_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Photos ({f.photoPreviews.length}/{MAX_PHOTOS})</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {f.photoPreviews.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 68, height: 68 }}>
                  <div style={{ width: "100%", height: "100%", background: `url(${p}) center/cover no-repeat`, border: `1.5px solid ${T.line}` }} />
                  <button onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, background: T.red, border: `2px solid ${T.card}`, borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} aria-label="Remove photo">
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}
              {f.photoPreviews.length < MAX_PHOTOS && (
                <label style={{ width: 68, height: 68, border: `1.5px dashed ${T.line}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.blue, gap: 3 }}>
                  <Upload size={16} />
                  <span style={{ fontFamily: T.head, fontSize: 9, fontWeight: 600 }}>Add photo</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
                </label>
              )}
            </div>
            <p style={{ fontFamily: T.body, fontSize: 11.5, color: T.blue, margin: "6px 0 0" }}>Clear daylight photos of the room and entrance help hunters decide faster.</p>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={f.desc} onChange={(e) => set("desc", e.target.value)} placeholder="What should a house hunter know?" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Your name</label>
              <input style={inputStyle} value={f.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="e.g. Caretaker Otieno" />
            </div>
            <div>
              <label style={labelStyle}>You are the</label>
              <div style={{ display: "flex", gap: 6 }}>
                {["Landlord", "Agent", "Caretaker"].map((r) => (
                  <button key={r} onClick={() => set("role", r)} style={{ flex: 1, padding: "10px 0", fontFamily: T.head, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${T.navy}`, background: f.role === r ? T.navy : "transparent", color: f.role === r ? T.cream : T.navy }}>{r}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Phone number</label>
            <input style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <button onClick={() => set("noFee", !f.noFee)} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: T.body, fontSize: 13, color: T.ink }}>
            <div style={{ width: 18, height: 18, border: `1.5px solid ${T.navy}`, display: "flex", alignItems: "center", justifyContent: "center", background: f.noFee ? T.navy : "transparent" }}>
              {f.noFee && <Check size={12} color={T.cream} />}
            </div>
            I do not charge a viewing fee
          </button>

          {error && <p style={{ color: T.red, fontFamily: T.body, fontSize: 13, margin: 0 }}>{error}</p>}

          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            style={{ marginTop: 6, background: canSubmit ? T.red : T.line, color: T.cream, border: "none", padding: "13px 0", fontFamily: T.head, fontWeight: 700, fontSize: 14, letterSpacing: 0.4, cursor: canSubmit ? "pointer" : "not-allowed" }}
          >
            {busy ? "POSTING…" : "SUBMIT LISTING"}
          </button>
          <p style={{ fontFamily: T.body, fontSize: 11.5, color: T.blue, margin: 0 }}>New listings show as "pending review" until our team confirms the details — this keeps the marketplace trustworthy for house hunters.</p>
        </div>
      </div>
    </div>
  );
}
