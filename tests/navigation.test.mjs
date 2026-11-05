import test from "node:test";
import assert from "node:assert/strict";
import { createNavigation, readRoute } from "../src/lib/navigation.js";

function browser(hash = "") {
  const listeners = new Map();
  const entries = [{ state: null, url: `/${hash}` }];
  let cursor = 0;
  let exited = false;
  const win = {
    location: { pathname: "/", search: "", hash },
    scrollY: 0,
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name) => listeners.delete(name),
    requestAnimationFrame: (fn) => fn(),
    scrollTo: ({ top }) => {
      win.scrollY = top;
    },
  };
  function sync() {
    win.location.hash = new URL(entries[cursor].url, "https://shop.example").hash;
  }
  win.history = {
    get state() {
      return entries[cursor].state;
    },
    scrollRestoration: "auto",
    replaceState(state, _, url) {
      entries[cursor] = { state, url };
      sync();
    },
    pushState(state, _, url) {
      entries.splice(cursor + 1);
      entries.push({ state, url });
      cursor++;
      sync();
    },
    back() {
      if (!cursor) {
        exited = true;
        return;
      }
      cursor--;
      sync();
      listeners.get("popstate")?.();
      listeners.get("hashchange")?.();
    },
    forward() {
      if (cursor + 1 < entries.length) {
        cursor++;
        sync();
        listeners.get("popstate")?.();
        listeners.get("hashchange")?.();
      }
    },
  };
  let route = readRoute(hash, null);
  const navigation = createNavigation(
    win,
    () => route,
    (value) => {
      route = value;
    },
  );
  return {
    win,
    navigation,
    entries,
    get route() {
      return route;
    },
    get exited() {
      return exited;
    },
  };
}

test("Back and Forward traverse home, category, product, and checkout without leaving", () => {
  const app = browser();
  app.navigation.navigate({ page: "shop", category: "Tops & Tees" });
  app.win.scrollY = 630;
  app.navigation.navigate({ page: "product", productId: 1022 });
  app.navigation.navigate({
    page: "checkout",
    checkoutItem: { items: [{ id: 1022, quantity: 1 }] },
  });
  app.win.history.back();
  assert.equal(app.route.page, "product");
  assert.equal(app.route.productId, 1022);
  app.win.history.back();
  assert.equal(app.route.category, "Tops & Tees");
  assert.equal(app.win.scrollY, 630);
  app.win.history.forward();
  app.win.history.forward();
  assert.equal(app.route.checkoutItem.items[0].id, 1022);
  assert.equal(app.exited, false);
});

test("repeated navigation does not add duplicates; all informational pages support Back", () => {
  const app = browser();
  for (const page of ["story", "contact", "wishlist", "account"]) app.navigation.navigate({ page });
  const count = app.entries.length;
  app.navigation.navigate({ page: "account" });
  assert.equal(app.entries.length, count);
  for (const page of ["wishlist", "contact", "story", "home"]) {
    app.win.history.back();
    assert.equal(app.route.page, page);
  }
  app.win.history.back();
  assert.equal(app.exited, true, "Back at the original entry may leave normally");
});

test("shared product links return to the product after checkout", () => {
  const app = browser("#product=1002");
  app.navigation.navigate({ page: "checkout", checkoutItem: { items: [{ id: 1002 }] } });
  app.navigation.back({ page: "home" });
  assert.equal(app.route.productId, "1002");
});

test("refresh retains checkout items and category URLs decode correctly", () => {
  const app = browser();
  app.navigation.navigate({ page: "checkout", checkoutItem: { items: [{ id: 1, quantity: 2 }] } });
  assert.equal(
    readRoute(app.win.location.hash, app.win.history.state).checkoutItem.items[0].quantity,
    2,
  );
  assert.equal(readRoute("#shop?category=Tops%20%26%20Tees", null).category, "Tops & Tees");
  assert.equal(readRoute("#checkout", null).page, "shop");
});

test("Back from checkout restores the bag, then closes it to the previous product", () => {
  const app = browser();
  app.navigation.navigate({ page: "product", productId: 1002 });
  app.navigation.navigate({ page: "product", productId: 1002, bagOpen: true });
  app.navigation.navigate({
    page: "checkout",
    checkoutItem: { items: [{ id: 1002 }] },
    checkoutFromBag: true,
  });
  app.win.history.back();
  assert.equal(app.route.bagOpen, true);
  app.win.history.back();
  assert.equal(app.route.page, "product");
  assert.equal(Boolean(app.route.bagOpen), false);
  assert.equal(app.exited, false);
});
