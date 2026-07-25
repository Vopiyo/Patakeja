import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./useAuth";
import { PLANS } from "../data/plans";

export function useSubscription() {
  const { user } = useAuth();
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setPlan("free");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("plan, status, current_period_end")
      .eq("user_id", user.id)
      .single();

    if (data && data.status === "active" && (!data.current_period_end || new Date(data.current_period_end) > new Date())) {
      setPlan(data.plan);
    } else {
      setPlan("free");
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { plan, planDetails: PLANS[plan], loading, refresh };
}
