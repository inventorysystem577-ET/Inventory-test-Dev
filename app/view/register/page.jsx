// app/register/page.jsx
"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Image from "next/image";

import WelcomeIcon from "../../components/WelcomeIcon";
import RegisterHeader from "../../components/RegisterHeader";
import RegisterForm from "../../components/RegisterForm";
import { handleFormSubmit } from "../../utils/formHandlers";
import { handleSubmitRegister } from "../../controller/registerController";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (password.length < 8 || !hasUpper || !hasLower || !hasDigit) {
      alert("Password must contain at least 8 characters, including uppercase, lowercase, and numbers.");
      return;
    }

    if (!reason.trim()) {
      alert("Please provide your reason for requesting access.");
      return;
    }

    handleFormSubmit({
      e,
      controllerFn: handleSubmitRegister,
      data: { name, email, password, role: "staff", reason: reason.trim() },
      setLoading,
      onSuccess: (response) => {
        alert(response.message || "Registration submitted. Please wait for admin approval.");
        window.location.href = "/";
      },
      onError: (error) => alert(error.message),
    });
  };

  return (
    <div className="flex h-screen font-inter overflow-hidden">
      <WelcomeIcon />

      {/* 📱 MOBILE DARK | 💻 DESKTOP WHITE */}
      <div className="w-full md:w-1/2 bg-[#0B0B0B] md:bg-white flex flex-col items-center justify-center p-8 overflow-y-auto transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-4">
            <div className="mb-2 w-full max-w-md drop-shadow-2xl mt-10 hover:scale-105 transition-transform duration-300 ease-in-out animate__animated animate__fadeInDown animate__slow">
              <Image
                src="/logo.png"
                alt="Company Logo"
                width={400}
                height={400}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Header */}
          <div className="animate__animated animate__fadeInDown animate__slow mb-2">
            <RegisterHeader />
          </div>

          {/* Form */}
          <div className="animate__animated animate__fadeInUp animate__slow mb-4">
            <RegisterForm
              name={name}
              setName={setName}
              email={email}
              setEmail={setEmail}
              reason={reason}
              setReason={setReason}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={onSubmit}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
