export function productIdFromHash(hash) {
  return /^#product=(\d+)$/.exec(hash)?.[1] || null;
}

export function whatsappProductUrl(product, origin) {
  const link = new URL("/", origin);
  link.hash = `product=${product.id}`;
  const message = `${product.name} — The Hand Craft Atelier\n${link.href}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
