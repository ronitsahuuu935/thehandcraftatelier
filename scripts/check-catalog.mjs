import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { products } = await server.ssrLoadModule("/src/data/catalog.js");
  const { designs } = await server.ssrLoadModule("/src/data/designs.js");
  const source = JSON.parse(fs.readFileSync("src/data/products.json", "utf8"));
  const actual = fs.readdirSync("public/media/products").map((file) => "/media/products/" + file);
  const included = source.flatMap((product) => product.gallery.map((item) => item.source));
  assert.deepEqual(
    new Set(included),
    new Set(actual),
    "Every product asset must belong to a gallery",
  );
  assert.equal(products.length, 20);
  assert.equal(designs.length, 33);
  const { default: OurStory } = await server.ssrLoadModule("/src/OurStory.jsx");
  const { Home } = await server.ssrLoadModule("/src/pages/Home.jsx");
  const { ProductDetail } = await server.ssrLoadModule("/src/pages/ProductDetail.jsx");
  const { default: ContactUs } = await server.ssrLoadModule("/src/ContactUs.jsx");
  const { GoogleSignInScreen } = await server.ssrLoadModule(
    "/src/components/GoogleSignInScreen.jsx",
  );
  const { SOCIAL } = await server.ssrLoadModule("/src/data/storefront.js");
  const props = {
    goShop: () => {},
    navigate: () => {},
    onOpen: () => {},
    onAdd: () => {},
    onBuyNow: () => {},
    isWishlisted: () => false,
    onToggleWishlist: () => {},
    productCatalog: products,
    search: "",
  };
  const markup = [
    renderToStaticMarkup(React.createElement(OurStory, props)),
    renderToStaticMarkup(React.createElement(Home, props)),
    renderToStaticMarkup(React.createElement(ContactUs, { contact: SOCIAL })),
    renderToStaticMarkup(React.createElement(GoogleSignInScreen, { onGoogleSignIn: () => {} })),
    ...products.map((product) =>
      renderToStaticMarkup(React.createElement(ProductDetail, { ...props, product })),
    ),
  ].join("");
  const assets = new Set(
    [...markup.matchAll(/(?:src|poster)="([^" ]+)"/g)]
      .map((match) => match[1])
      .filter((src) => src.startsWith("/")),
  );
  for (const match of markup.matchAll(/url\((\/[^)]+)\)/g)) assets.add(match[1]);
  for (const src of assets) {
    assert.ok(src.startsWith("/media/"), `Asset still depends on an original folder: ${src}`);
    assert.ok(fs.existsSync(path.join("public", src)), `Missing rendered asset ${src}`);
  }
  // Check CSS backgrounds, favicon, preload, and admin asset paths too.
  for (const filename of [
    "src/story.css",
    "src/contact.css",
    "src/styles.css",
    "src/admin.css",
    "src/AdminPanel.jsx",
    "index.html",
  ]) {
    const text = fs.readFileSync(filename, "utf8");
    assert.ok(!/["'`](?:\/images\/|\/products\/)/.test(text), `Legacy asset path in ${filename}`);
    for (const match of text.matchAll(/["'](\/media\/[^"']+)["']/g)) {
      assert.ok(
        fs.existsSync(path.join("public", match[1])),
        `Missing asset in ${filename}: ${match[1]}`,
      );
    }
  }
  for (const file of fs.readdirSync("public/media/images")) {
    const original = "/media/images/" + file;
    assert.ok(assets.has(original), `Image not used in page markup: ${file}`);
  }
  for (const product of products)
    for (const item of product.gallery)
      assert.ok(fs.existsSync(path.join("public", item.src)), `Missing gallery asset ${item.src}`);
  console.log(
    JSON.stringify({
      products: products.length,
      designs: designs.length,
      productAssets: actual.length,
      renderedAssets: assets.size,
      allImagesUsed: true,
    }),
  );
} finally {
  await server.close();
}
