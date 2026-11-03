import "regenerator-runtime/runtime.js";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { isPaidOrder } from "../lib/orders.js";

export const LABEL_FONT_URL = "/media/fonts/NotoSansDevanagari.ttf";

const clean = (value) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim();

function wrapText(text, font, size, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of clean(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    // Split unusually long words instead of letting them overflow the label.
    const segments = new Intl.Segmenter("en", { granularity: "grapheme" }).segment(word);
    for (const { segment } of segments) {
      if (line && font.widthOfTextAtSize(line + segment, size) > maxWidth) {
        lines.push(line);
        line = "";
      }
      line += segment;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function createShippingLabel(order, { fontBytes, sender }) {
  if (!isPaidOrder(order)) throw new Error("Labels are available only for paid orders.");
  if (
    !clean(order.recipient_name) ||
    !clean(order.shipping_address_line1) ||
    !clean(order.shipping_postal_code)
  ) {
    throw new Error(
      "This order needs a recipient name, delivery address, and postal code before a label can be downloaded.",
    );
  }

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const orderId = clean(order.id);
  pdf.setTitle(`Shipping label — ${orderId}`);
  pdf.setAuthor(sender.name);
  pdf.setSubject("Prepaid shipping label");

  const width = 288; // Four inches at 72 PDF points per inch.
  const margin = 18;
  const blocks = [];
  function text(value, size, gap = 3) {
    if (!clean(value)) return;
    const lines = wrapText(value, font, size, width - margin * 2);
    blocks.push({ lines, size, height: lines.length * size * 1.25 + gap });
  }
  function divider() {
    blocks.push({ divider: true, height: 12 });
  }

  text(sender.name, 12, 9);
  text("SHIP TO", 9);
  text(order.recipient_name, 17);
  text(order.recipient_phone ? `Phone: ${clean(order.recipient_phone)}` : "", 12);
  divider();
  text(order.shipping_address_line1, 13);
  text(order.shipping_address_line2, 13);
  text([order.shipping_city, order.shipping_state].map(clean).filter(Boolean).join(", "), 12);
  text(`PIN: ${clean(order.shipping_postal_code)}`, 15);
  text(order.shipping_country || "India", 10);
  divider();
  text("Payment: PREPAID", 11);
  text(
    `Order total: ₹${Number(order.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    11,
  );
  text(`Order: ${orderId}`, 8);
  divider();
  text("SHIPPED BY / IF UNDELIVERED, RETURN TO", 8);
  text(sender.name, 12);
  text(sender.address, 10);
  text(`PIN: ${sender.postalCode}`, 11);
  text(`Phone: ${sender.phone}`, 11);

  // Standard 4×6 label; extend only for exceptionally long addresses, never clip them.
  const height = Math.max(
    432,
    Math.ceil(blocks.reduce((sum, block) => sum + block.height, 0) + margin * 2),
  );
  const page = pdf.addPage([width, height]);
  page.drawRectangle({
    x: 9,
    y: 9,
    width: width - 18,
    height: height - 18,
    borderColor: rgb(0.75, 0.75, 0.75),
    borderWidth: 0.5,
  });
  let cursor = height - margin;
  for (const block of blocks) {
    if (block.divider) {
      page.drawLine({
        start: { x: margin, y: cursor - 4 },
        end: { x: width - margin, y: cursor - 4 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
    } else {
      block.lines.forEach((line, index) =>
        page.drawText(line, {
          x: margin,
          y: cursor - block.size - index * block.size * 1.25,
          size: block.size,
          font,
          color: rgb(0, 0, 0),
        }),
      );
    }
    cursor -= block.height;
  }
  return pdf.save();
}

export async function downloadShippingLabel(order, sender) {
  const response = await fetch(LABEL_FONT_URL);
  if (!response.ok) throw new Error("The label font could not load. Please try again.");
  const bytes = await createShippingLabel(order, {
    fontBytes: await response.arrayBuffer(),
    sender,
  });
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `shipping-label-${String(order.id).replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
