export const FREE_SHIPPING_THRESHOLD = 1998;
export const FLAT_SHIPPING_FEE = 50;

export function shippingCostFor(subtotal) {
  return Number(subtotal) >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}
