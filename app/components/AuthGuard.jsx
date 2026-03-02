"use client";

import { useAuth } from "../hook/useAuth";

/* ================= AUTH GUARD ================= */
export default function AuthGuard({ children, darkMode = false }) {
  const { loading: authLoading, userEmail } = useAuth();

  if (authLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          darkMode ? "bg-[#020617]" : "bg-white"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-full border-4 animate-spin ${
            darkMode
              ? "border-white/25 border-t-white"
              : "border-gray-300 border-t-[#1E40AF]"
          }`}
        />
      </div>
    );
  }

  if (!userEmail) return null;

  return <>{children}</>;
}
