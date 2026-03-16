"use client";

import { useState } from "react";
import Link from "next/link";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

export default function RegisterComponents({
  name,
  setName,
  email,
  setEmail,
  reason,
  setReason,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getPasswordStrength = (value) => {
    if (!value) return 0;
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthLabel = strength <= 1 ? "Weak" : strength === 2 ? "Medium" : "Strong";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Name
        </label>
        <input
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg
            border-gray-600 md:border-gray-300
            bg-gray-800 md:bg-white
            text-white md:text-black
            focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
            transition-all"
          required
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Role
        </label>
        <input
          type="text"
          value="Staff (requires admin approval)"
          disabled
          className="w-full px-4 py-3 border rounded-lg
            border-gray-600 md:border-gray-300
            bg-gray-700 md:bg-gray-100
            text-gray-300 md:text-gray-700
            cursor-not-allowed"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg
            border-gray-600 md:border-gray-300
            bg-gray-800 md:bg-white
            text-white md:text-black
            focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
            transition-all"
          required
        />
      </div>

      {/* Registration Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Reason for Access
        </label>
        <textarea
          placeholder="Tell the admin why you need access"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border rounded-lg
            border-gray-600 md:border-gray-300
            bg-gray-800 md:bg-white
            text-white md:text-black
            focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
            transition-all resize-none"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border rounded-lg
              border-gray-600 md:border-gray-300
              bg-gray-800 md:bg-white
              text-white md:text-black
              focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
              transition-all"
            required
            minLength={8}
            title="Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 md:text-gray-600 hover:text-blue-400 md:hover:text-blue-600"
          >
            {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
        </div>
        <p className="text-xs text-gray-400 md:text-gray-500 mt-1">
          At least 8 characters with uppercase, lowercase, and numbers
        </p>
        <div className="mt-2 space-y-1">
          <div className="grid grid-cols-3 gap-1.5">
            <div className={`h-1.5 rounded ${strength >= 1 ? "bg-red-500" : "bg-gray-300"}`} />
            <div className={`h-1.5 rounded ${strength >= 2 ? "bg-yellow-500" : "bg-gray-300"}`} />
            <div className={`h-1.5 rounded ${strength >= 3 ? "bg-green-500" : "bg-gray-300"}`} />
          </div>
          <p className="text-xs text-gray-400 md:text-gray-500">Strength: {password ? strengthLabel : "—"}</p>
        </div>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 md:text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 border rounded-lg
              border-gray-600 md:border-gray-300
              bg-gray-800 md:bg-white
              text-white md:text-black
              focus:outline-none focus:border-blue-500 focus:ring-3 focus:ring-blue-100
              transition-all"
            required
            minLength={8}
            title="Password must contain at least 8 characters, including uppercase, lowercase, and numbers"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 md:text-gray-600 hover:text-blue-400 md:hover:text-blue-600"
          >
            {showConfirmPassword ? <FaRegEyeSlash /> : <FaRegEye />}
          </button>
        </div>
      </div>

      {/* Sign Up button */}
      <button
        type="submit"
        className="w-full py-3 text-white font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 transition-all duration-200"
      >
        Sign Up
      </button>

      {/* Already have an account link */}
      <p className="text-center text-sm text-gray-400 md:text-gray-600">
        Already have an account?{" "}
        <Link
          href="/"
          className="font-medium text-blue-400 md:text-blue-600 hover:text-blue-500 md:hover:text-blue-700"
        >
          Sign In
        </Link>
      </p>
    </form>
  );
}
