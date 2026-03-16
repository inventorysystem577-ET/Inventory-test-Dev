import { supabase } from "../../lib/supabaseClient";

const PENDING_REQUESTS_TABLE = "access_requests_temp";
const APPROVED_USERS_TABLE = "user_profiles";

const normalizeStatus = (status, fallback = "approved") => {
  if (!status) return fallback;
  const normalized = String(status).toLowerCase();
  if (normalized === "approved" || normalized === "denied" || normalized === "pending") {
    return normalized;
  }
  return fallback;
};

const resolveApprovalStatus = (profile) => {
  if (!profile) return "pending";
  if (profile.is_approved) return "approved";
  if (profile.rejected_at) return "denied";
  return "pending";
};

export async function login({ email, password }) {
  if (!email || !password) {
    throw new Error("Email and Password are required");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const metadataRole = String(data?.user?.user_metadata?.role || "").toLowerCase();
  if (metadataRole === "admin") {
    return data;
  }

  const { data: profile } = await supabase
    .from(APPROVED_USERS_TABLE)
    .select("id, role, is_approved, rejected_at")
    .eq("id", data?.user?.id)
    .maybeSingle();

  if (String(profile?.role || "").toLowerCase() === "admin") {
    return data;
  }

  const metadataStatus = normalizeStatus(data?.user?.user_metadata?.status, "pending");
  const effectiveStatus = profile ? resolveApprovalStatus(profile) : metadataStatus;

  if (effectiveStatus !== "approved") {
    await supabase.auth.signOut();
    if (effectiveStatus === "denied") {
      throw new Error("Your registration was denied by admin.");
    }
    throw new Error("Your account is pending admin approval.");
  }

  return data;
}

export async function registerUser({ name, email, password, role, reason }) {
  if (!name || !email || !password || !reason) {
    throw new Error("Missing fields");
  }

  const normalizedRole = role || "staff";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: normalizedRole, status: "pending" } },
  });

  if (error) throw error;

  const userId = data?.user?.id;
  if (!userId) {
    throw new Error("Unable to create user account");
  }

  const { error: pendingError } = await supabase.from(PENDING_REQUESTS_TABLE).upsert({
    id: userId,
    name,
    email,
    role: normalizedRole,
    reason,
    is_approved: false,
    approved_at: null,
    approved_by: null,
    rejected_at: null,
    rejected_by: null,
  });

  if (pendingError) {
    throw new Error(`Unable to save pending request: ${pendingError.message}`);
  }

  return data;
}

export async function sendResetEmail(email) {
  if (!email || typeof email !== "string") {
    throw new Error("Valid email is required");
  }

  // Basic format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(password) {
  if (!password || password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) throw error;
  return data;
}
