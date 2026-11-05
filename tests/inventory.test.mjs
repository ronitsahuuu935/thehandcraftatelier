import test from "node:test";
import assert from "node:assert/strict";
import { canPurchase, cartAvailabilityError } from "../src/lib/inventory.js";

test("zero stock blocks purchases and restored stock allows them", () => {
  assert.equal(canPurchase({ stock_quantity: 0 }), false);
  assert.equal(canPurchase({ stock_quantity: "0" }), false);
  assert.equal(canPurchase({ stock_quantity: 3 }, 3), true);
  assert.equal(canPurchase({ stock_quantity: 3 }, 4), false);
  assert.equal(canPurchase({ stock_quantity: null }), true);
  assert.equal(canPurchase({ stock_quantity: 3, is_active: false }), false);
});

test("stock is shared across sizes and duplicate cart lines", () => {
  const products = [{ id: 1, name: "Shirt", stock_quantity: 3 }];
  assert.match(
    cartAvailabilityError(
      [
        { product_id: 1, quantity: 2, size: "S" },
        { product_id: 1, quantity: 2, size: "M" },
      ],
      products,
    ),
    /unavailable/,
  );
  assert.equal(cartAvailabilityError([{ id: 1, quantity: 3 }], products), "");
});

test("removed products and invalid quantities cannot proceed to checkout", () => {
  assert.match(cartAvailabilityError([{ id: 1 }], []), /no longer available/);
  assert.match(cartAvailabilityError([{ id: 1, quantity: -1 }], []), /valid quantity/);
});
