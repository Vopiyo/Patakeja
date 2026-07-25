// Display-only plan definitions. The Edge Function
// (initiate-payment) has its own server-side price table and does
// not trust anything from the client — this file just drives the
// UI and the free-tier listing limit.
export const PLANS = {
  free: {
    label: "Free",
    price: 0,
    priceLabel: "Ksh 0",
    listingLimit: 1,
    features: ["1 active listing", "Standard placement", "Standard verification queue", "Up to 6 photos per listing"],
  },
  standard: {
    label: "Standard",
    price: 300,
    priceLabel: "Ksh 300/mo",
    listingLimit: 10,
    features: ["Up to 10 active listings", "Standard placement", "Standard verification queue", "Basic view-count analytics"],
  },
  pro: {
    label: "Pro",
    price: 1000,
    priceLabel: "Ksh 1,000/mo",
    listingLimit: Infinity,
    features: ["Unlimited active listings", "Featured badge, top of results", "Priority verification (24-48hr)", "Up to 12 photos per listing", "Views + call/WhatsApp click analytics"],
  },
};
