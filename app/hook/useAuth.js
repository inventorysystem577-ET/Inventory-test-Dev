"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export const useAuth = () => {
  const [userEmail, setUserEmail] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const applySession = (session) => {
      if (!mounted) return;

      if (!session) {
        setUserEmail(null);
        setDisplayName(null);
        setRole(null);
        setLoading(false);
        router.replace("/");
        return;
      }

      setUserEmail(session.user?.email || null);
      setDisplayName(
        session.user?.user_metadata?.display_name ||
          session.user?.user_metadata?.name ||
          null,
      );
      setRole(session.user?.user_metadata?.role || "staff");
      setLoading(false);
    };

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        applySession(session);
      } catch (error) {
        console.error("Error checking session:", error.message);
        applySession(null);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return { userEmail, displayName, role, loading };
};
