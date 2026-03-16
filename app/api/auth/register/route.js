import { supabase } from "../../../../lib/supabaseClient";

export async function POST(req) {
  try {
    const { name, email, password, role, reason } = await req.json();

    // Step 1: Create the auth.users account to get the real UUID
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (authError) throw new Error(authError.message);

    const authUserId = authData.user?.id;
    if (!authUserId) throw new Error("Auth account creation failed — no user ID returned.");

    // Step 2: Insert into access_requests_temp using the real auth UUID
    const { error: insertError } = await supabase
      .from("access_requests_temp")
      .insert({
        id: authUserId,
        name,
        email,
        role: role || "staff",
        reason: reason || "",
        is_approved: false,
      });

    if (insertError) {
      throw new Error(`Account created but registration request failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        message: "Registration submitted. Your account is pending admin approval.",
        user: authData.user,
      }),
      { status: 201 },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: error.message || "Server error" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}