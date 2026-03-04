"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hook/useAuth";
import { isAdminRole } from "../utils/roleHelper";

/* ================= AUTH GUARD ================= */
export default function AuthGuard({ children, darkMode = false }) {
  const { loading: authLoading, userEmail, role } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = isAdminRole(role);

  useEffect(() => {
    if (authLoading || !userEmail) return;
    if (isAdmin) return;
    if (pathname !== "/view/product-in") {
      router.replace("/view/product-in");
    }
  }, [authLoading, userEmail, isAdmin, pathname, router]);

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
  if (!isAdmin && pathname !== "/view/product-in") return null;

  return <>{children}</>;
}
