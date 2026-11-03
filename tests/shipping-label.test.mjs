import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { createShippingLabel } from "../src/admin/shipping-label.js";
import { isPaidOrder } from "../src/lib/orders.js";

const fontBytes = await fs.readFile(
  new URL("../public/media/fonts/NotoSansDevanagari.ttf", import.meta.url),
);
const sender = {
  name: "The Hand Craft Atelier",
  address: "Malviya Nagar, Creware Coworks, near Saras Parlour",
  postalCode: "302017",
  phone: "+91 78776 42926",
};
const order = {
  id: "12345678-1234-1234-1234-123456789012",
  payment_status: "paid",
  recipient_name: "Sample Customer",
  recipient_phone: "9000000000",
  shipping_address_line1: "12, Sample Apartments",
  shipping_address_line2: "Near the community garden",
  shipping_city: "Jaipur",
  shipping_state: "Rajasthan",
  shipping_postal_code: "302005",
  shipping_country: "India",
  total: 1999,
};

test("only confirmed payment states qualify for labels", () => {
  for (const payment_status of ["paid", " PAID ", "success", "successful", "captured"])
    assert.equal(isPaidOrder({ payment_status }), true);
  for (const payment_status of [
    undefined,
    null,
    "",
    "pending",
    "failed",
    "unpaid",
    "refunded",
    "processing",
  ])
    assert.equal(isPaidOrder({ payment_status }), false);
});
test("a paid order produces a single printable 4 by 6 inch PDF", async () => {
  const bytes = await createShippingLabel(order, { fontBytes, sender });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.equal(pdf.getTitle(), `Shipping label — ${order.id}`);
  assert.equal(pdf.getPage(0).getWidth(), 288);
  assert.equal(pdf.getPage(0).getHeight(), 432);
});
test("unpaid orders are rejected even if generation is invoked directly", async () => {
  await assert.rejects(
    createShippingLabel({ ...order, payment_status: "pending" }, { fontBytes, sender }),
    /only for paid/,
  );
});
test("an incomplete delivery address does not produce a misleading label", async () => {
  await assert.rejects(
    createShippingLabel({ ...order, shipping_address_line1: "" }, { fontBytes, sender }),
    /delivery address/,
  );
});
test("long Hindi addresses are retained without extra pages or clipped content", async () => {
  const bytes = await createShippingLabel(
    {
      ...order,
      recipient_name: "किरण शर्मा",
      shipping_address_line1: "मालवीय नगर, सरस पार्लर के पास ".repeat(18),
      shipping_address_line2: "Apartment".repeat(40),
    },
    { fontBytes, sender },
  );
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 1);
  assert.ok(pdf.getPage(0).getHeight() > 432);
});

test("one click creates a PDF download without opening a print dialog", async () => {
  const { downloadShippingLabel } = await import("../src/admin/shipping-label.js");
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalTimeout = globalThis.setTimeout;
  let clicks = 0,
    removed = false,
    revoked = false;
  const link = {
    click() {
      clicks++;
    },
    remove() {
      removed = true;
    },
  };
  try {
    globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => fontBytes });
    globalThis.document = { createElement: () => link, body: { appendChild() {} } };
    URL.createObjectURL = (blob) => {
      assert.equal(blob.type, "application/pdf");
      return "blob:test-label";
    };
    URL.revokeObjectURL = () => {
      revoked = true;
    };
    globalThis.setTimeout = (callback) => {
      callback();
      return 0;
    };
    await downloadShippingLabel(order, sender);
    assert.equal(clicks, 1);
    assert.equal(link.download, `shipping-label-${order.id}.pdf`);
    assert.equal(link.href, "blob:test-label");
    assert.equal(removed, true);
    assert.equal(revoked, true);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    globalThis.setTimeout = originalTimeout;
  }
});
