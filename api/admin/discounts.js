import { createClient } from "@supabase/supabase-js";

const getConfig = () => ({
  supabaseUrl:
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  serverKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export default async function adminDiscounts(request, response) {
  if (request.method !== "DELETE") {
    response.setHeader("Allow", "DELETE");
    return response.status(405).json({ error: "Method not allowed." });
  }
  const token = String(request.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const code = String(request.query?.code || "")
    .trim()
    .toUpperCase();
  const { supabaseUrl, publishableKey, serverKey } = getConfig();
  if (!token || !code)
    return response.status(400).json({ error: "Admin session and coupon code are required." });
  if (
    !supabaseUrl ||
    !publishableKey ||
    !serverKey ||
    /placeholder|sample|\*{3,}/i.test(serverKey)
  ) {
    return response
      .status(500)
      .json({ error: "Server-side Supabase credentials are not configured." });
  }

  const authClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userResult, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userResult.user)
    return response.status(401).json({ error: "Your admin session has expired. Sign in again." });

  const adminClient = createClient(supabaseUrl, serverKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: adminGrant, error: grantError } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userResult.user.id)
    .maybeSingle();
  if (grantError)
    return response.status(500).json({ error: "Could not verify admin permissions." });
  if (!adminGrant)
    return response
      .status(403)
      .json({ error: "This account is not authorized to manage discounts." });

  const { error } = await adminClient.from("discounts").delete().eq("code", code);
  if (error) {
    console.error("Admin discount deletion failed.", error.message);
    return response.status(500).json({ error: "Could not delete the discount." });
  }
  return response.status(200).json({ deleted: code });
}
