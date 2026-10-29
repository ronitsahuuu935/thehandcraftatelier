import { createClient } from "@supabase/supabase-js";

const paymentIsPaid = value => ["paid", "success", "successful", "captured"].includes(String(value || "").toLowerCase());
const paymentIsUnpaid = value => ["", "pending", "unpaid", "failed", "declined", "not_required"].includes(String(value || "").toLowerCase());
const isCod = value => /cash\s*on\s*delivery|\bcod\b/i.test(String(value || ""));

export default async function rejectOrder(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const authorization = request.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  let body = request.body || {};
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { return response.status(400).json({ error: "Invalid request body." }); }
  const orderId = String(body.orderId || "").trim();
  const reason = String(body.reason || "").trim().slice(0, 500);
  if (!token || !orderId || !reason) return response.status(400).json({ error: "Admin session, order ID, and rejection reason are required." });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serverKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !publishableKey || !serverKey || /placeholder|sample|\*{3,}/i.test(serverKey)) {
    return response.status(500).json({ error: "Server-side Supabase credentials are not configured for order processing." });
  }

  const authClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userResult, error: authError } = await authClient.auth.getUser(token);
  if (authError || !userResult.user) return response.status(401).json({ error: "Your admin session has expired. Sign in again." });

  const adminClient = createClient(supabaseUrl, serverKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: adminGrant, error: grantError } = await adminClient.from("admin_users").select("user_id").eq("user_id", userResult.user.id).maybeSingle();
  if (grantError) return response.status(500).json({ error: "Could not verify admin permissions." });
  if (!adminGrant) return response.status(403).json({ error: "This account is not authorized to manage orders." });

  const { data: order, error: orderError } = await adminClient.from("orders")
    .select("id,status,payment_status,payment_method,total,cashfree_order_id,cashfree_refund_id,refund_status")
    .eq("id", orderId).maybeSingle();
  if (orderError) return response.status(500).json({ error: "Could not load the order. Apply the order rejection migration and retry." });
  if (!order) return response.status(404).json({ error: "Order not found." });

  const currentStatus = String(order.status || "").toLowerCase();
  const currentRefund = String(order.refund_status || "not_required").toLowerCase();
  if (["shipped", "delivered", "fulfilled"].includes(currentStatus)) {
    return response.status(409).json({ error: "This order has already shipped or been delivered. Use the returns process instead." });
  }
  if (currentStatus === "rejected") {
    return response.status(200).json({ status: "Rejected", refundStatus: currentRefund, alreadyRejected: true });
  }

  const paymentStatus = String(order.payment_status || "pending").toLowerCase();
  let refundStatus = "not_required";
  let cashfreeRefundId = order.cashfree_refund_id || null;
  if (paymentIsPaid(paymentStatus) && isCod(order.payment_method)) {
    refundStatus = "manual_required";
  } else if (paymentIsPaid(paymentStatus)) {
    if (!order.cashfree_order_id) return response.status(409).json({ error: "This order is marked paid but has no Cashfree order ID. Verify the payment in Cashfree before rejecting it." });
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY || !process.env.CASHFREE_BASE_URL) {
      return response.status(500).json({ error: "Cashfree refund credentials are not configured on the server." });
    }
    cashfreeRefundId = cashfreeRefundId || `RF${String(order.id).replace(/[^a-z0-9]/gi, "").toUpperCase()}`;
    const baseUrl = process.env.CASHFREE_BASE_URL.replace(/\/+$/, "");
    let refundResponse;
    try {
      refundResponse = await fetch(`${baseUrl}/orders/${encodeURIComponent(order.cashfree_order_id)}/refunds`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": process.env.CASHFREE_API_VERSION || "2023-08-01",
          "x-idempotency-key": cashfreeRefundId
        },
        body: JSON.stringify({ refund_amount: Number(order.total), refund_id: cashfreeRefundId, refund_note: reason })
      });
    } catch {
      return response.status(502).json({ error: "Could not reach Cashfree. The order was not rejected; check Cashfree before retrying." });
    }
    const refundBody = await refundResponse.json().catch(() => ({}));
    if (!refundResponse.ok) {
      console.error("Cashfree refund request failed", { orderId, status: refundResponse.status, refundId: cashfreeRefundId });
      return response.status(502).json({ error: "Cashfree could not start the refund. The order was not rejected; check Cashfree and retry." });
    }
    refundStatus = String(refundBody.refund_status || refundBody.status || "pending").toLowerCase();
  } else if (!paymentIsUnpaid(paymentStatus)) {
    return response.status(409).json({ error: `Payment is currently ${paymentStatus}. Verify its final status before rejecting this order.` });
  }

  const update = {
    status: "Rejected",
    rejection_reason: reason,
    rejected_at: new Date().toISOString(),
    refund_status: refundStatus,
    ...(cashfreeRefundId ? { cashfree_refund_id: cashfreeRefundId } : {})
  };
  const { error: updateError } = await adminClient.from("orders").update(update).eq("id", orderId);
  if (updateError) {
    console.error("Could not save order rejection", { orderId, refundId: cashfreeRefundId, message: updateError.message });
    return response.status(500).json({ error: "The refund request was sent, but the rejection could not be saved. Contact support before retrying." });
  }
  return response.status(200).json({ status: "Rejected", refundStatus, refundId: cashfreeRefundId });
}
