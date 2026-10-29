import crypto from "node:crypto";
import { getAdminClient, getCashfreeConfig } from "../../../src/lib/cashfree-server.js";

export const config = {
  api: {
    bodyParser: false
  }
};

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function signaturesMatch(expected, received) {
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export default async function cashfreeWebhook(request, response) {
  if (request.method === "GET") {
    return response.status(200).json({ status: "ok", endpoint: "cashfree-webhook" });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const config = getCashfreeConfig();
  const secret = config?.secret;
  const timestamp = request.headers["x-webhook-timestamp"];
  const receivedSignature = request.headers["x-webhook-signature"];
  const rawBody = await readRawBody(request);

  if (typeof timestamp !== "string" || typeof receivedSignature !== "string") {
    console.warn("Cashfree webhook connectivity probe received without signature; no event was processed.");
    return response.status(200).json({ received: true, verified: false });
  }

  if (!secret) {
    console.error("CASHFREE_SECRET_KEY is not configured.");
    return response.status(500).json({ error: "Webhook verification is not configured" });
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  if (!signaturesMatch(expectedSignature, receivedSignature)) {
    return response.status(401).json({ error: "Invalid webhook signature" });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return response.status(400).json({ error: "Invalid JSON payload" });
  }

  const orderId = String(event.data?.order?.order_id || "").trim();
  const paymentStatus = String(event.data?.payment?.payment_status || "").toUpperCase();
  if (!orderId || !["SUCCESS", "FAILED"].includes(paymentStatus)) {
    return response.status(200).json({ received: true, processed: false });
  }

  const admin = getAdminClient(config);
  const { data: order, error: orderError } = await admin.from("orders")
    .select("id,total,payment_status")
    .eq("cashfree_order_id", orderId)
    .maybeSingle();
  if (orderError) {
    console.error("Cashfree webhook could not load order", { orderId, message: orderError.message });
    return response.status(500).json({ error: "Could not process payment notification" });
  }
  if (!order) return response.status(200).json({ received: true, processed: false });

  const gatewayAmount = Number(event.data?.payment?.payment_amount ?? event.data?.order?.order_amount);
  if (!Number.isFinite(gatewayAmount) || Math.abs(gatewayAmount - Number(order.total)) >= 0.01) {
    console.error("Cashfree webhook amount mismatch", { orderId, expected: order.total, received: gatewayAmount });
    return response.status(400).json({ error: "Payment amount mismatch" });
  }
  if (paymentStatus === "SUCCESS") {
    const { error } = await admin.from("orders").update({
      payment_status: "paid",
      status: "Processing",
      cashfree_payment_id: String(event.data?.payment?.cf_payment_id || "") || null
    }).eq("id", order.id);
    if (error) {
      console.error("Cashfree webhook could not save successful payment", { orderId, message: error.message });
      return response.status(500).json({ error: "Could not save payment status" });
    }
  } else if (String(order.payment_status).toLowerCase() !== "paid") {
    const { error } = await admin.from("orders").update({ payment_status: "failed", status: "Payment failed" }).eq("id", order.id);
    if (error) {
      console.error("Cashfree webhook could not save failed payment", { orderId, message: error.message });
      return response.status(500).json({ error: "Could not save payment status" });
    }
  }
  return response.status(200).json({ received: true, processed: true });
}
