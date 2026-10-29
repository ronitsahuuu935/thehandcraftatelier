import { cashfreeHeaders, getAdminClient, getAuthorizedUser, getCashfreeConfig } from "../../../src/lib/cashfree-server.js";

export default async function verifyCashfreeOrder(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  const config = getCashfreeConfig();
  if (!config) return response.status(500).json({ error: "Online payment verification is not configured." });
  const user = await getAuthorizedUser(request, config);
  if (!user) return response.status(401).json({ error: "Sign in to verify this payment." });

  let body = request.body || {};
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { return response.status(400).json({ error: "Invalid verification request." }); }
  const orderId = String(body.orderId || "").trim();
  if (!/^hca-[a-z0-9-]{8,50}$/i.test(orderId)) return response.status(400).json({ error: "Invalid order reference." });

  const admin = getAdminClient(config);
  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,customer_id,total,payment_status,status,cashfree_order_id")
    .eq("cashfree_order_id", orderId)
    .maybeSingle();
  if (orderError) return response.status(500).json({ error: "Could not load your order." });
  if (!order) return response.status(404).json({ error: "Order not found." });
  const { data: customer, error: customerError } = await admin.from("customers")
    .select("auth_user_id")
    .eq("id", order.customer_id)
    .maybeSingle();
  if (customerError || customer?.auth_user_id !== user.id) return response.status(403).json({ error: "This order does not belong to your account." });

  let gatewayResponse;
  try {
    const headers = cashfreeHeaders(config);
    delete headers["content-type"];
    gatewayResponse = await fetch(`${config.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
      headers
    });
  } catch (error) {
    console.error("Cashfree order verification failed", error.message);
    return response.status(502).json({ error: "We could not check payment status. Please refresh in a moment." });
  }
  const gatewayOrder = await gatewayResponse.json().catch(() => ({}));
  if (!gatewayResponse.ok) {
    console.error("Cashfree order status request failed", { status: gatewayResponse.status, code: gatewayOrder.code || null });
    return response.status(502).json({ error: "Cashfree could not confirm the payment yet." });
  }
  const amountMatches = Math.abs(Number(gatewayOrder.order_amount) - Number(order.total)) < 0.01;
  if (!amountMatches || gatewayOrder.order_currency !== "INR") {
    console.error("Cashfree order amount mismatch", { orderId, dbTotal: order.total, currency: gatewayOrder.order_currency });
    return response.status(409).json({ error: "The payment amount did not match this order. Contact the atelier before retrying." });
  }

  const gatewayStatus = String(gatewayOrder.order_status || "").toUpperCase();
  if (gatewayStatus === "PAID") {
    const { error: updateError } = await admin.from("orders").update({ payment_status: "paid", status: "Processing" }).eq("id", order.id);
    if (updateError) {
      console.error("Could not save verified Cashfree payment", { orderId, message: updateError.message });
      return response.status(500).json({ error: "Payment is confirmed, but we could not update your order. Contact the atelier with your order reference." });
    }
    return response.status(200).json({ status: "paid", orderId, amount: Number(order.total) });
  }
  if (["EXPIRED", "TERMINATED"].includes(gatewayStatus)) {
    await admin.from("orders").update({ payment_status: "failed", status: "Payment failed" }).eq("id", order.id).neq("payment_status", "paid");
    return response.status(200).json({ status: "failed", orderId, message: "Cashfree reports this payment session expired or failed." });
  }
  return response.status(200).json({ status: "pending", orderId, message: "Cashfree is still processing this payment." });
}
