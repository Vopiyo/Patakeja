import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Heart, Plus, SlidersHorizontal, ShieldCheck, Zap,
  Home as HomeIcon, Info, LogIn, LogOut, User as UserIcon, ListChecks, Sparkles,
} from "lucide-react";
import { T, FONT_IMPORT, SIZES } from "./data/theme";
import { PLANS } from "./data/plans";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useSubscription } from "./hooks/useSubscription";
import { supabase } from "./lib/supabaseClient";
import { Pill } from "./components/shared";
import ListingCard from "./components/ListingCard";
import ListingModal from "./components/ListingModal";
import PostModal from "./components/PostModal";
import AuthModal from "./components/AuthModal";
import UpgradeModal from "./components/UpgradeModal";

function PataKejaApp() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const { plan, planDetails, refresh: refreshSubscription } = useSubscription();

  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [tab, setTab] = useState("browse"); // browse | saved | mine
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("All towns");
  const [sizeFilter, setSizeFilter] = useState([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [noFeeOnly, setNoFeeOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showPost, setShowPost] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState(null);

  const flashToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // ---- Load listings from Supabase ----
  const loadListings = useCallback(async () => {
    setListingsLoading(true);
    const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
    if (!error) setListings(data || []);
    setListingsLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  // ---- Load this user's favourites whenever they sign in/out ----
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    supabase.from("favorites").select("listing_id").eq("user_id", user.id).then(({ data, error }) => {
      if (!error) setFavoriteIds(new Set((data || []).map((r) => r.listing_id)));
    });
  }, [user]);

  const toggleFav = async (listingId) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const isFav = favoriteIds.has(listingId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listingId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
    }
  };

  const toggleSize = (s) => setSizeFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const cities = useMemo(() => ["All towns", ...Array.from(new Set(listings.map((l) => l.city)))], [listings]);

  const filtered = useMemo(() => {
    let out = listings.filter((l) => {
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || (l.estate || "").toLowerCase().includes(q) || (l.city || "").toLowerCase().includes(q) || (l.title || "").toLowerCase().includes(q);
      const matchesCity = city === "All towns" || l.city === city;
      const matchesSize = sizeFilter.length === 0 || sizeFilter.includes(l.size);
      const matchesMin = !minPrice || l.price >= Number(minPrice);
      const matchesMax = !maxPrice || l.price <= Number(maxPrice);
      const matchesVerified = !verifiedOnly || l.verified;
      const matchesNoFee = !noFeeOnly || l.no_fee;
      return matchesQuery && matchesCity && matchesSize && matchesMin && matchesMax && matchesVerified && matchesNoFee;
    });
    if (sortBy === "price-asc") out = [...out].sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") out = [...out].sort((a, b) => b.price - a.price);
    if (sortBy === "newest") out = [...out].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return out;
  }, [listings, query, city, sizeFilter, minPrice, maxPrice, verifiedOnly, noFeeOnly, sortBy]);

  const visible = tab === "saved" ? filtered.filter((l) => favoriteIds.has(l.id))
    : tab === "mine" ? filtered.filter((l) => user && l.owner_id === user.id)
    : filtered;

  const handlePosted = () => {
    setShowPost(false);
    setTab("mine");
    loadListings();
    flashToast('Listing submitted — it\'ll show as "pending review" until verified.');
  };

  const handleDelete = async (listing) => {
    if (!window.confirm("Delete this listing? This can't be undone.")) return;
    const { error } = await supabase.from("listings").delete().eq("id", listing.id);
    if (!error) {
      setSelected(null);
      loadListings();
      flashToast("Listing deleted.");
    }
  };

  const handleReport = async (listing) => {
    // Minimal reporting: logs to a `reports` table if it exists; falls back to a toast.
    try {
      await supabase.from("reports").insert({ listing_id: listing.id, reporter_id: user?.id || null });
    } catch (e) { /* table optional — see README */ }
    flashToast("Thanks — our team reviews every report within 24 hours.");
  };

  const openPost = () => {
    if (!user) { setShowAuth(true); return; }
    const myActiveCount = listings.filter((l) => l.owner_id === user.id).length;
    if (myActiveCount >= planDetails.listingLimit) {
      flashToast(`Your ${PLANS[plan].label} plan allows ${planDetails.listingLimit === Infinity ? "unlimited" : planDetails.listingLimit} active listing${planDetails.listingLimit === 1 ? "" : "s"} — upgrade to add more.`);
      setShowUpgrade(true);
      return;
    }
    setShowPost(true);
  };

  const activeFilterCount = sizeFilter.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (verifiedOnly ? 1 : 0) + (noFeeOnly ? 1 : 0) + (city !== "All towns" ? 1 : 0);
  const chipBase = { padding: "7px 13px", fontFamily: T.head, fontSize: 12.5, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${T.navy}`, whiteSpace: "nowrap" };

  return (
    <div style={{ background: T.paper, minHeight: "100%", fontFamily: T.body, color: T.ink, paddingBottom: 70 }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        input:focus, textarea:focus { outline: 2px solid ${T.gold}; outline-offset: 1px; }
        button:focus-visible, a:focus-visible { outline: 2px solid ${T.gold}; outline-offset: 2px; }
        .listing-card:hover { transform: translateY(-3px); box-shadow: 6px 6px 0 ${T.navy}22; }
        @media (min-width: 640px) { .mobile-nav { display: none !important; } }
      `}</style>

      {/* HEADER */}
      <header style={{ background: T.navy, padding: "16px 20px", position: "sticky", top: 0, zIndex: 30, borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: T.gold, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(-4deg)" }}>
              <HomeIcon size={19} color={T.navy} strokeWidth={2.5} />
            </div>
            <span style={{ fontFamily: T.display, color: T.cream, fontSize: 20, letterSpacing: 0.5 }}>PATAKEJA</span>
          </div>
          <nav style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button onClick={() => setTab("browse")} style={{ background: tab === "browse" ? T.gold : "transparent", color: tab === "browse" ? T.navy : T.cream, border: "none", padding: "9px 16px", fontFamily: T.head, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Browse</button>
            <button onClick={() => setTab("saved")} style={{ background: tab === "saved" ? T.gold : "transparent", color: tab === "saved" ? T.navy : T.cream, border: "none", padding: "9px 16px", fontFamily: T.head, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Heart size={14} /> Saved {favoriteIds.size > 0 && `(${favoriteIds.size})`}
            </button>
            {user && (
              <button onClick={() => setTab("mine")} style={{ background: tab === "mine" ? T.gold : "transparent", color: tab === "mine" ? T.navy : T.cream, border: "none", padding: "9px 16px", fontFamily: T.head, fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <ListChecks size={14} /> My listings
              </button>
            )}
            {user && (
              <button onClick={() => setShowUpgrade(true)} style={{ background: "transparent", color: plan === "free" ? T.gold : "#7FBE9E", border: `1.5px solid ${plan === "free" ? T.gold : "#7FBE9E"}`, padding: "8px 14px", fontFamily: T.head, fontWeight: 700, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={13} /> {plan === "free" ? "Upgrade" : PLANS[plan].label}
              </button>
            )}
            <button onClick={openPost} style={{ background: T.red, color: T.cream, border: "none", padding: "9px 16px", fontFamily: T.head, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> List your house
            </button>
            {!authLoading && (user ? (
              <button onClick={signOut} title={profile?.full_name} style={{ background: "transparent", color: T.cream, border: `1.5px solid ${T.gold}`, padding: "8px 14px", fontFamily: T.head, fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <LogOut size={13} /> {profile?.full_name ? profile.full_name.split(" ")[0] : "Sign out"}
              </button>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ background: "transparent", color: T.cream, border: `1.5px solid ${T.gold}`, padding: "8px 14px", fontFamily: T.head, fontWeight: 600, fontSize: 12.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <LogIn size={13} /> Sign in
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* HERO / SEARCH */}
      <section style={{ background: `linear-gradient(180deg, ${T.navy}, ${T.navyLight})`, padding: "38px 20px 90px", textAlign: "center" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div style={{ display: "inline-block", background: T.gold, color: T.navy, fontFamily: T.head, fontWeight: 700, fontSize: 12, padding: "5px 12px", marginBottom: 14, transform: "rotate(-2deg)" }}>
            NO VIEWING FEES · NO MIDDLEMEN · TALK TO THE LANDLORD
          </div>
          <h1 style={{ fontFamily: T.display, color: T.cream, fontSize: "clamp(28px, 5vw, 44px)", lineHeight: 1.15, margin: "0 0 12px" }}>
            FIND YOUR NEXT<br />KEJA. DIRECTLY.
          </h1>
          <p style={{ fontFamily: T.body, color: "#C9D3DC", fontSize: 15, margin: "0 0 26px" }}>
            Search bedsitters to family homes across Kenyan towns — every listing shows the real contact, the real price, and the real place.
          </p>
        </div>

        <div style={{ maxWidth: 780, margin: "0 auto", background: T.cream, padding: 16, border: `3px solid ${T.gold}`, textAlign: "left" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px", display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1.5px solid ${T.line}`, padding: "10px 14px" }}>
              <Search size={16} color={T.blue} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search estate, town, or 'Kilimani'..." style={{ border: "none", outline: "none", fontFamily: T.body, fontSize: 14, width: "100%", background: "transparent" }} />
            </div>
            <select value={city} onChange={(e) => setCity(e.target.value)} style={{ flex: "0 0 160px", padding: "10px 12px", border: `1.5px solid ${T.line}`, fontFamily: T.head, fontSize: 13, fontWeight: 600, color: T.ink, background: "#fff" }}>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={() => setShowFilters((s) => !s)} style={{ background: T.navy, color: T.cream, border: "none", padding: "0 18px", fontFamily: T.head, fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <SlidersHorizontal size={15} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
          </div>

          {showFilters && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1.5px dashed ${T.line}`, display: "grid", gap: 14 }}>
              <div>
                <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 11.5, color: T.blue, marginBottom: 8, letterSpacing: 0.4 }}>HOUSE SIZE</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {SIZES.map((s) => (
                    <button key={s} onClick={() => toggleSize(s)} style={{ ...chipBase, background: sizeFilter.includes(s) ? T.navy : "transparent", color: sizeFilter.includes(s) ? T.cream : T.navy }}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 11.5, color: T.blue, marginBottom: 8, letterSpacing: 0.4 }}>MIN PRICE (KSH)</div>
                  <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" style={{ width: 120, padding: "8px 10px", border: `1.5px solid ${T.line}`, fontFamily: T.mono, fontSize: 13 }} />
                </div>
                <div>
                  <div style={{ fontFamily: T.head, fontWeight: 700, fontSize: 11.5, color: T.blue, marginBottom: 8, letterSpacing: 0.4 }}>MAX PRICE (KSH)</div>
                  <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="No limit" style={{ width: 120, padding: "8px 10px", border: `1.5px solid ${T.line}`, fontFamily: T.mono, fontSize: 13 }} />
                </div>
                <button onClick={() => setVerifiedOnly((v) => !v)} style={{ ...chipBase, display: "flex", alignItems: "center", gap: 6, background: verifiedOnly ? T.green : "transparent", color: verifiedOnly ? T.cream : T.green, border: `1.5px solid ${T.green}` }}>
                  <ShieldCheck size={13} /> Verified only
                </button>
                <button onClick={() => setNoFeeOnly((v) => !v)} style={{ ...chipBase, display: "flex", alignItems: "center", gap: 6, background: noFeeOnly ? T.red : "transparent", color: noFeeOnly ? T.cream : T.red, border: `1.5px solid ${T.red}` }}>
                  <Zap size={13} /> No viewing fee
                </button>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: "8px 10px", border: `1.5px solid ${T.line}`, fontFamily: T.head, fontSize: 12.5, fontWeight: 600 }}>
                  <option value="newest">Newest first</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RESULTS */}
      <main style={{ maxWidth: 1100, margin: "-56px auto 0", padding: "0 20px", position: "relative", zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "24px 0 16px", flexWrap: "wrap", gap: 8 }}>
          <h2 style={{ fontFamily: T.head, fontWeight: 700, fontSize: 18, color: T.ink, margin: 0 }}>
            {tab === "saved" ? "Your saved listings" : tab === "mine" ? "Your listings" : `${visible.length} listing${visible.length !== 1 ? "s" : ""} found`}
          </h2>
        </div>

        {listingsLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", fontFamily: T.body, color: T.blue }}>Loading listings…</div>
        ) : visible.length === 0 ? (
          <div style={{ background: T.card, border: `2px dashed ${T.line}`, padding: "50px 20px", textAlign: "center" }}>
            <HomeIcon size={30} color={T.blue} style={{ marginBottom: 10 }} />
            <p style={{ fontFamily: T.head, fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
              {tab === "saved" ? "Nothing saved yet" : tab === "mine" ? "You haven't posted a listing yet" : "No listings match those filters"}
            </p>
            <p style={{ fontFamily: T.body, fontSize: 13, color: T.blue, margin: 0 }}>
              {tab === "saved" ? "Tap the heart on any listing to keep it here." : tab === "mine" ? "Click \"List your house\" above to add one." : "Try widening your price range or clearing a filter."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 26 }}>
            {visible.map((l) => (
              <ListingCard key={l.id} listing={l} isFav={favoriteIds.has(l.id)} onToggleFav={toggleFav} onOpen={setSelected} />
            ))}
          </div>
        )}

        <footer style={{ textAlign: "center", padding: "50px 0 10px", fontFamily: T.body, fontSize: 12, color: T.blue }}>
          PataKeja — a house-hunting concept for Kenyan towns and cities.
        </footer>
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="mobile-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.navy, borderTop: `3px solid ${T.gold}`, display: "flex", zIndex: 30 }}>
        <button onClick={() => setTab("browse")} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 8px", color: tab === "browse" ? T.gold : T.cream, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: T.head, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
          <Search size={18} /> Browse
        </button>
        <button onClick={() => setTab("saved")} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 8px", color: tab === "saved" ? T.gold : T.cream, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: T.head, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
          <Heart size={18} /> Saved
        </button>
        <button onClick={openPost} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 8px", color: T.cream, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: T.head, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={18} /> Post
        </button>
        <button onClick={() => user ? setTab("mine") : setShowAuth(true)} style={{ flex: 1, background: "none", border: "none", padding: "10px 0 8px", color: tab === "mine" ? T.gold : T.cream, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: T.head, fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}>
          <UserIcon size={18} /> {user ? "Mine" : "Sign in"}
        </button>
      </div>

      {selected && (
        <ListingModal
          key={selected.id}
          listing={selected}
          isFav={favoriteIds.has(selected.id)}
          onToggleFav={toggleFav}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
          onReport={handleReport}
        />
      )}
      {showPost && <PostModal onClose={() => setShowPost(false)} onPosted={handlePosted} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showUpgrade && (
        <UpgradeModal
          currentPlan={plan}
          onClose={() => setShowUpgrade(false)}
          onUpgraded={() => { refreshSubscription(); }}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 84, left: "50%", transform: "translateX(-50%)", background: T.green, color: T.cream, padding: "12px 20px", fontFamily: T.head, fontWeight: 600, fontSize: 13, zIndex: 60, display: "flex", alignItems: "center", gap: 8, maxWidth: "90%", textAlign: "center" }}>
          <Info size={15} /> {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PataKejaApp />
    </AuthProvider>
  );
}
