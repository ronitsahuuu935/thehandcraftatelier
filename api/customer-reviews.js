import { createClient } from "@supabase/supabase-js";

const clean = value => String(value || "").trim();

export default async function submitProductReview(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !serviceKey) return response.status(500).json({ error: "Review storage is not configured." });

  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return response.status(401).json({ error: "Sign in to review a purchase." });

  const authClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userResult, error: authError } = await authClient.auth.getUser(token);
  const user = userResult?.user;
  if (authError || !user) return response.status(401).json({ error: "Your session has expired. Sign in again." });

  let body = request.body || {};
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { return response.status(400).json({ error: "Invalid review details." }); }
  const orderId = clean(body.orderId);
  const productId = Number(body.productId);
  const rating = Number(body.rating);
  const review = clean(body.review);
  if (!/^[0-9a-f-]{36}$/i.test(orderId) || !Number.isSafeInteger(productId) || productId < 1 || !Number.isInteger(rating) || rating < 1 || rating > 5 || review.length < 5 || review.length > 2000) {
    return response.status(400).json({ error: "Enter a rating and a review between 5 and 2,000 characters." });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: customer, error: customerError } = await admin.from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (customerError) return response.status(500).json({ error: "Could not verify your customer account." });
  if (!customer) return response.status(403).json({ error: "Complete a purchase before writing a review." });

  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,customer_id,items,payment_status,status,refund_status")
    .eq("id", orderId)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (orderError) return response.status(500).json({ error: "Could not verify this order." });
  if (!order) return response.status(404).json({ error: "We could not find this purchase in your account." });

  const status = String(order.status || "").toLowerCase();
  const refundStatus = String(order.refund_status || "not_required").toLowerCase();
  if (String(order.payment_status || "").toLowerCase() !== "paid" || ["cancelled", "canceled", "rejected", "refunded"].includes(status) || !["", "not_required", "not required"].includes(refundStatus)) {
    return response.status(403).json({ error: "Reviews are available only for paid, non-refunded purchases." });
  }
  const purchasedItem = (Array.isArray(order.items) ? order.items : []).some(item => String(item.product_id) === String(productId));
  if (!purchasedItem) return response.status(403).json({ error: "You can review only a product included in this paid order." });

  const { error: insertError } = await admin.from("product_reviews").insert({
    customer_id: customer.id,
    order_id: order.id,
    product_id: productId,
    rating,
    review,
    verified_purchase: true
  });
  if (insertError?.code === "23505") return response.status(409).json({ error: "You have already reviewed this product from this order." });
  if (insertError) {
    console.error("Unable to save verified product review", { code: insertError.code, message: insertError.message });
    return response.status(500).json({ error: "We could not save your review. Please try again." });
  }
  return response.status(201).json({ success: true, verifiedPurchase: true });
}
