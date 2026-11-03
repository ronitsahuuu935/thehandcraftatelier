export function isPaidOrder(order) {
  return ["paid", "success", "successful", "captured"].includes(
    String(order?.payment_status || "")
      .trim()
      .toLowerCase(),
  );
}
