import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (!error) setProfile(data);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) fetchProfile(newSession.user.id);
      else setProfile(null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Creates the auth user, then a matching row in `profiles` with the
  // contact details PataKeja needs (name, phone, role). If your Supabase
  // project has "Confirm email" turned on, `data.user` exists but the
  // session is null until the user clicks the confirmation link — in
  // that case we can't write the profile row yet (RLS requires
  // auth.uid()), so we surface a "check your email" message instead.
  const signUp = async ({ email, password, fullName, phone, role }) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error };

    if (data.session) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        phone,
        role,
      });
      if (profileError) return { error: profileError };
      await fetchProfile(data.user.id);
      return { data, needsEmailConfirmation: false };
    }
    return { data, needsEmailConfirmation: true };
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile: () => fetchProfile(session?.user?.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
