// New selections use a JSON list in the existing text column.
export function discountCategories(scope) {
  if (!scope || scope === "All Products") return [];
  try {
    const categories = JSON.parse(scope);
    if (Array.isArray(categories)) return categories;
  } catch {
    // Legacy discounts store a single category name directly.
  }
  return [scope];
}

export function categoryDiscount(coupon, items) {
  if (!coupon) return 0;
  const categories = discountCategories(coupon.applicable_to);
  const eligible = items.reduce((sum, item) => {
    if (categories.length && !categories.includes(item.category)) return sum;
    return sum + Number(item.unit_price ?? item.price) * (item.quantity ?? 1);
  }, 0);
  return Math.min(
    eligible,
    coupon.type === "Percentage" ? (eligible * coupon.value) / 100 : Number(coupon.value),
  );
}
