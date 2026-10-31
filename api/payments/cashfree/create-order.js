import crypto from "node:crypto";
import { cashfreeHeaders, getAdminClient, getAuthorizedUser, getCashfreeConfig, normalizeIndianPhone } from "../../../src/lib/cashfree-server.js";

const clean = value => String(value || "").trim();

export default async function createCashfreeOrder(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const config = getCashfreeConfig();
  if (!config) return response.status(500).json({ error: "Online payment is not configured on the server." });
  const user = await getAuthorizedUser(request, config);
  if (!user) return response.status(401).json({ error: "Please sign in again before paying." });

  let body = request.body || {};
  try { if (typeof body === "string") body = JSON.parse(body || "{}"); } catch { return response.status(400).json({ error: "Invalid checkout details." }); }
  const details = body.details || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const fullName = clean(details.customer_name);
  const email = clean(details.email).toLowerCase();
  const phone = normalizeIndianPhone(details.phone);
  const address = clean(details.address);
  const city = clean(details.city);
  const state = clean(details.state);
  const postalCode = clean(details.postal_code);
  if (!fullName || !/^\S+@\S+\.\S+$/.test(email) || !phone || !address || !city || !state || !/^\d{6}$/.test(postalCode)) {
    return response.status(400).json({ error: "Enter valid contact and delivery details before payment." });
  }
  if (!items.length || items.length > 20) return response.status(400).json({ error: "Your cart is empty or has too many items." });

  const productIds = [...new Set(items.map(item => String(item.product_id ?? "").trim()).filter(Boolean))];
  if (!productIds.length) return response.status(400).json({ error: "The cart contains an invalid product." });
  const admin = getAdminClient(config);
  const { data: products, error: productsError } = await admin.from("products")
    .select("id,name,price,category,sizes,gallery")
    .in("id", productIds);
  if (productsError) {
    console.error("Cashfree checkout could not load catalog prices", productsError.message);
    return response.status(500).json({ error: "We could not verify product prices. Please try again." });
  }
  const byId = new Map((products || []).map(product => [String(product.id), product]));
  const orderItems = [];
  for (const item of items) {
    const product = byId.get(String(item.product_id));
    const quantity = Number(item.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return response.status(400).json({ error: "A product in your cart is unavailable or has an invalid quantity." });
    }
    const selectedSize = clean(item.size);
    const availableSizes = Array.isArray(product.sizes) && product.sizes.length ? product.sizes : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
    if (selectedSize && !availableSizes.includes(selectedSize)) return response.status(400).json({ error: "The selected size is not available for this product." });
    const selectedColor = clean(item.color);
    const availableColors = [...new Set((Array.isArray(product.gallery) ? product.gallery : []).map(image => clean(image?.color)).filter(Boolean))];
    if (selectedColor && availableColors.length && !availableColors.includes(selectedColor)) return response.status(400).json({ error: "The selected color is not available for this product." });
    orderItems.push({
      product_id: product.id,
      name: product.name,
      category: product.category,
      unit_price: Number(product.price),
      quantity,
      size: selectedSize || null,
      color: selectedColor || null,
      personalization: clean(item.personalization) || null
    });
  }
  const total = Math.round(orderItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;
  if (!Number.isFinite(total) || total < 200) return response.status(400).json({ error: "The minimum order total for online payment is ₹200." });

  const { data: customer, error: customerError } = await admin.from("customers").upsert({
    auth_user_id: user.id,
    full_name: fullName,
    email,
    phone,
    address_line1: address,
    address_line2: clean(details.address_line2) || null,
    city,
    state,
    postal_code: postalCode
  }, { onConflict: "auth_user_id" }).select("id").single();
  if (customerError || !customer) {
    console.error("Cashfree checkout could not save customer", customerError?.message);
    return response.status(500).json({ error: "We could not save your customer details. Please try again." });
  }

  const addressLine2 = clean(details.address_line2);
  const { data: order, error: orderError } = await admin.from("orders").insert({
    customer_id: customer.id,
    items: orderItems,
    subtotal: total,
    shipping_cost: 0,
    total,
    payment_method: "Cashfree",
    payment_status: "pending",
    status: "pending",
    recipient_name: fullName,
    recipient_email: email,
    recipient_phone: phone,
    shipping_address_line1: address,
    shipping_address_line2: addressLine2 || null,
    shipping_city: city,
    shipping_state: state,
    shipping_postal_code: postalCode,
    shipping_country: "India"
  }).select("id").single();
  if (orderError || !order) {
    console.error("Cashfree checkout could not create store order", { code: orderError?.code, message: orderError?.message, details: orderError?.details, hint: orderError?.hint });
    return response.status(500).json({ error: "We could not create your order. Please try again." });
  }

  const cashfreeOrderId = `hca-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  let returnOrigin = "https://thehandcraftatelier.live";
  try { returnOrigin = new URL(process.env.CASHFREE_RETURN_URL || returnOrigin).origin; } catch { /* keep the verified store origin */ }
  const returnUrl = `${returnOrigin}/?order_id={order_id}`;
  const notifyUrl = process.env.CASHFREE_WEBHOOK_URL?.trim();
  const orderMeta = { return_url: returnUrl };
  if (notifyUrl) orderMeta.notify_url = notifyUrl;
  let gatewayResponse;
  try {
    gatewayResponse = await fetch(`${config.baseUrl}/orders`, {
      method: "POST",
      headers: cashfreeHeaders(config, { "x-idempotency-key": crypto.randomUUID() }),
      body: JSON.stringify({
        order_id: cashfreeOrderId,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: String(user.id),
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone
        },
        order_meta: orderMeta,
        order_note: `Handcraft Atelier order ${order.id}`,
        order_tags: { store_order_id: String(order.id) }
      })
    });
  } catch (error) {
    console.error("Cashfree create-order request failed", error.message);
    await admin.from("orders").update({ status: "pending" }).eq("id", order.id);
    return response.status(502).json({ error: "Cashfree could not be reached. Your order was not charged; please retry." });
  }
  const gatewayOrder = await gatewayResponse.json().catch(() => ({}));
  if (!gatewayResponse.ok || !gatewayOrder.payment_session_id) {
    console.error("Cashfree rejected create-order request", { status: gatewayResponse.status, code: gatewayOrder.code || null });
    await admin.from("orders").update({ status: "pending" }).eq("id", order.id);
    return response.status(502).json({ error: "Cashfree could not start the payment. Please check your details and retry." });
  }

  const { error: linkError } = await admin.from("orders").update({ cashfree_order_id: cashfreeOrderId }).eq("id", order.id);
  if (linkError) {
    console.error("Could not link Cashfree order to store order", { orderId: order.id, message: linkError.message });
    return response.status(500).json({ error: "Payment was prepared but could not be linked to the order. Contact the atelier before retrying." });
  }

  return response.status(200).json({ orderId: cashfreeOrderId, paymentSessionId: gatewayOrder.payment_session_id });
}
