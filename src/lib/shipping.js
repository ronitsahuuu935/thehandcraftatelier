export const FREE_SHIPPING_THRESHOLD = 1998;
export const STANDARD_SHIPPING_FEE = 60;
export const JAIPUR_SHIPPING_FEE = 50;

export function shippingCostFor(subtotal, city = "") {
  if (Number(subtotal) >= FREE_SHIPPING_THRESHOLD) return 0;
  return String(city).trim().toLowerCase() === "jaipur"
    ? JAIPUR_SHIPPING_FEE
    : STANDARD_SHIPPING_FEE;
}
