import { createClient } from "@supabase/supabase-js";

export default async function getCustomerOrders(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !serviceKey) return response.status(500).json({ error: "Customer orders are not configured." });

  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return response.status(401).json({ error: "Sign in to view your orders." });

  const authClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userResult, error: authError } = await authClient.auth.getUser(token);
  const user = userResult?.user;
  if (authError || !user) return response.status(401).json({ error: "Your session has expired. Sign in again." });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: customer, error: customerError } = await admin.from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (customerError) {
    console.error("Could not map authenticated user to customer profile.", customerError.message);
    return response.status(500).json({ error: "Could not load your customer profile." });
  }
  if (!customer) return response.status(200).json({ orders: [] });

  const { data: orders, error: ordersError } = await admin.from("orders")
    .select("id,items,total,status,payment_status,refund_status,created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (ordersError) {
    console.error("Could not load customer order history.", ordersError.message);
    return response.status(500).json({ error: "Could not load your orders right now." });
  }
  return response.status(200).json({ orders: orders || [] });
}
