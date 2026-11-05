import { productIdFromHash } from "./product-sharing.js";

export function routeHash(route) {
  if (route.bagOpen) return "#bag";
  if (route.page === "home") return "";
  if (route.page === "story") return "#our-story";
  if (route.page === "product") return `#product=${route.productId}`;
  if (route.page === "shop" && route.category && route.category !== "All pieces")
    return `#shop?category=${encodeURIComponent(route.category)}`;
  return `#${route.page}`;
}

export function readRoute(hash, state) {
  if (state?.atelierNavigation && state.hash === hash) return state.route;
  const productId = productIdFromHash(hash);
  if (productId) return { page: "product", productId };
  if (hash === "#bag") return { page: "home", bagOpen: true };
  if (hash === "#our-story") return { page: "story" };
  if (["#contact", "#wishlist", "#account"].includes(hash)) return { page: hash.slice(1) };
  if (hash === "#shop" || hash.startsWith("#shop?"))
    return {
      page: "shop",
      category: new URLSearchParams(hash.split("?")[1]).get("category") || "All pieces",
    };
  // A checkout URL alone has no items; send it to the shop.
  if (hash === "#checkout") return { page: "shop", category: "All pieces" };
  return { page: "home" };
}

export function createNavigation(win, getSnapshot, onRoute) {
  const { history, location } = win;
  const url = (hash) => location.pathname + location.search + hash;
  const entry = (route, hash, index, scrollY = 0) => ({
    atelierNavigation: true,
    route,
    hash,
    index,
    scrollY,
  });
  if (!history.state?.atelierNavigation)
    history.replaceState(
      entry(readRoute(location.hash, history.state), location.hash, 0),
      "",
      url(location.hash),
    );
  const previousRestoration = history.scrollRestoration;
  history.scrollRestoration = "manual";
  const restore = () => {
    onRoute(readRoute(location.hash, history.state));
    win.requestAnimationFrame(() =>
      win.scrollTo({ top: history.state?.scrollY || 0, behavior: "instant" }),
    );
  };
  win.addEventListener("popstate", restore);
  win.addEventListener("hashchange", restore);
  return {
    navigate(route, { replace = false } = {}) {
      const hash = routeHash(route);
      const index = history.state?.index || 0;
      if (!replace && hash !== location.hash) {
        history.replaceState(
          entry(getSnapshot(), location.hash, index, win.scrollY),
          "",
          url(location.hash),
        );
        history.pushState(entry(route, hash, index + 1), "", url(hash));
      } else {
        history.replaceState(entry(route, hash, index), "", url(hash));
      }
      onRoute(route);
      win.scrollTo({ top: 0, behavior: "instant" });
    },
    back(fallback) {
      if (history.state?.atelierNavigation && history.state.index > 0) history.back();
      else this.navigate(fallback, { replace: true });
    },
    destroy() {
      win.removeEventListener("popstate", restore);
      win.removeEventListener("hashchange", restore);
      history.scrollRestoration = previousRestoration;
    },
  };
}
