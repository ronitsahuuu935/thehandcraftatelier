import crypto from "node:crypto";

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
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const secret = process.env.CASHFREE_SECRET_KEY;
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

  console.info("Cashfree webhook received", {
    type: event.type || event.event_type || "unknown",
    orderId: event.data?.order?.order_id || event.data?.order?.order_tags?.order_id || null
  });

  return response.status(200).json({ received: true });
}
