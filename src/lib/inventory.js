export function canPurchase(product, quantity = 1) {
  if (!product || product.is_active === false || !Number.isInteger(quantity) || quantity < 1)
    return false;
  // An unset inventory is untracked; an explicit zero is unavailable.
  return product.stock_quantity == null || quantity <= Number(product.stock_quantity);
}

export function cartAvailabilityError(items, products) {
  const totals = new Map();
  for (const item of items) {
    const id = String(item.product_id ?? item.id);
    const quantity = Number(item.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) return "Choose a valid quantity.";
    totals.set(id, (totals.get(id) || 0) + quantity);
  }
  for (const [id, quantity] of totals) {
    const product = products.find((candidate) => String(candidate.id) === id);
    if (!product) return "A product in your bag is no longer available.";
    if (!canPurchase(product, quantity))
      return `${product.name} is out of stock or the requested quantity is unavailable.`;
  }
  return "";
}
