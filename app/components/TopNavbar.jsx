"use client";

import { X, Menu, Sun, Moon } from "lucide-react";
import { useAuth } from "../hook/useAuth";
import { getDisplayName, getAvatarLetter } from "../utils/userHelper";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Import Animate.css
import "animate.css";

export default function TopNavbar({
  sidebarOpen,
  setSidebarOpen,
  darkMode,
  setDarkMode,
}) {
  const { userEmail, displayName, role, loading } = useAuth();
  const router = useRouter();

  const displayedName = getDisplayName(null, userEmail);
  const avatarLetter = getAvatarLetter(null, userEmail);

  // Load dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      setDarkMode(savedDarkMode === "true");
    }
  }, [setDarkMode]);

  // Save dark mode to localStorage when it changes
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
  };

  return (
    <nav
      className={`fixed w-full z-30 top-0 shadow-sm border-b ${
        darkMode ? "bg-[#111827] border-[#374151]" : "bg-white border-[#E5E7EB]"
      }`}
    >
      <div className="px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left side */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${
                darkMode
                  ? "text-[#D1D5DB] hover:bg-[#1F2937]"
                  : "text-[#6B7280] hover:bg-[#F3F4F6]"
              }`}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo - changes based on dark mode */}
            <button
              type="button"
              onClick={() => router.push("/view/dashboard")}
              className="rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/70"
              aria-label="Go to dashboard"
            >
              <img
                src={darkMode ? "/logo.png" : "/logo2.png"}
                alt="logo"
                className="h-8 sm:h-10 w-auto animate__animated animate__fadeIn animate__slow"
              />
            </button>
          </div>

          {/* Right side - User Profile + Dark Mode Toggle */}
          <div
            className={`flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l ${
              darkMode ? "border-[#374151]" : "border-[#E5E7EB]"
            }`}
          >
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-md transition ${
                darkMode ? "hover:bg-[#1F2937]" : "hover:bg-[#F3F4F6]"
              }`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-[#FACC15]" />
              ) : (
                <Moon className="w-5 h-5 text-[#6B7280]" />
              )}
            </button>

            {/* User Profile */}
            <div className="text-right hidden md:block">
              {loading ? (
                <p className="text-xs lg:text-sm font-medium text-[#9CA3AF]">
                  Loading...
                </p>
              ) : (
                <>
                  <p
                    className={`text-xs lg:text-sm font-medium ${
                      darkMode ? "text-white" : "text-[#111827]"
                    }`}
                  >
                    {displayedName}
                  </p>
                  <p
                    className={`text-[10px] lg:text-xs ${
                      darkMode ? "text-[#D1D5DB]" : "text-[#6B7280]"
                    }`}
                  >
                    {(role || "staff").toString().toUpperCase()}
                  </p>
                </>
              )}
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#1E3A8A] flex items-center justify-center text-white text-sm sm:text-base font-semibold">
              {avatarLetter}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
