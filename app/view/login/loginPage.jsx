"use client";

import { useState } from "react";
import Image from "next/image";

import WelcomeIcon from "../../components/WelcomeIcon";
import LoginHeader from "../../components/LoginHeader";
import LoginForm from "../../components/LoginForm";
import { handleSubmitLogin } from "../../controller/loginController";
import { handleFormSubmit } from "../../utils/formHandlers";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState("");
  const router = useRouter();

  const onSubmit = (e) => {
    handleFormSubmit({
      e,
      controllerFn: handleSubmitLogin,
      data: { email, password },
      setLoading,
      onSuccess: async (response) => {
        console.log("Logged in user:", response.user);
        alert("Login Successful!");
        const role = (response?.user?.user_metadata?.role || "")
          .toString()
          .toLowerCase();
        if (role === "staff") {
          router.push("/view/product-in");
          return;
        }
        router.push("/view/dashboard");
      },
      onError: (error) => {
        console.error("Login error:", error.message);
        alert(error.message);
      },
    });
  };

  return (
    <div className="flex h-screen font-inter overflow-hidden">
      <WelcomeIcon />

      {/* MOBILE DARK | DESKTOP WHITE */}
      <div className="w-full md:w-1/2 bg-[#0B0B0B] md:bg-white flex flex-col items-center justify-center p-8 overflow-y-auto transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* MOBILE LOGO */}
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

          {/* HEADER */}
          <div className="animate__animated animate__fadeInDown animate__slow mb-2">
            <LoginHeader />
          </div>

          {/* FORM */}
          <div className="animate__animated animate__fadeInUp animate__slow mb-4">
            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={onSubmit}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
