import test from "node:test";
import assert from "node:assert/strict";
import { productIdFromHash, whatsappProductUrl } from "../src/lib/product-sharing.js";

test("WhatsApp share includes an encoded name and a direct product link", () => {
  const url = new URL(
    whatsappProductUrl(
      { id: 1022, name: "Pink & Daisy Co-ord" },
      "https://thehandcraftatelier.live",
    ),
  );
  assert.equal(url.origin, "https://wa.me");
  const text = url.searchParams.get("text");
  assert.ok(text.includes("Pink & Daisy Co-ord"));
  const link = new URL(text.split("\n")[1]);
  assert.equal(productIdFromHash(link.hash), "1022");
  assert.equal(link.search, "");
});

test("other routes and malformed product hashes are not product links", () => {
  for (const hash of ["", "#contact", "#product=", "#product=abc", "#product=12extra"])
    assert.equal(productIdFromHash(hash), null);
});
