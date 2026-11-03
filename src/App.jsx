import React, { useEffect, useState } from "react";

import { ShoppingBag, ArrowRight, Check, ShieldCheck } from "lucide-react";
import { productStorageBucket, supabase } from "./lib/supabase";
import AdminPanel from "./AdminPanel";
import OurStory from "./OurStory";
import ContactUs from "./ContactUs";

import { PRODUCT_IMG, SOCIAL, AVAILABLE_SIZES, products } from "./data/storefront.js";

import { ADMIN_HASH, PENDING_CHECKOUT_KEY } from "./data/app.js";
import { Header } from "./components/Header.jsx";
import { Footer } from "./components/Footer.jsx";
import { FloatingSocials } from "./components/FloatingSocials.jsx";
import { CartDrawer } from "./components/CartDrawer.jsx";

import { GoogleSignInScreen } from "./components/GoogleSignInScreen.jsx";
import { Home } from "./pages/Home.jsx";
import { Shop } from "./pages/Shop.jsx";
import { ProductDetail } from "./pages/ProductDetail.jsx";
import { Wishlist } from "./pages/Wishlist.jsx";
import { CustomerAccount } from "./pages/CustomerAccount.jsx";
import { Checkout } from "./pages/Checkout.jsx";

export function App() {
  const [productCatalog, setProductCatalog] = useState(products);
  const [adminMode, setAdminMode] = useState(() => window.location.hash === ADMIN_HASH);
  useEffect(() => {
    const syncAdminRoute = () => setAdminMode(window.location.hash === ADMIN_HASH);
    window.addEventListener("hashchange", syncAdminRoute);
    return () => window.removeEventListener("hashchange", syncAdminRoute);
  }, []);
  const [page, setPage] = useState(() =>
    window.location.hash === "#contact"
      ? "contact"
      : window.location.hash === "#our-story"
        ? "story"
        : "home",
  );
  useEffect(() => {
    const syncInfoRoute = () => {
      if (window.location.hash === "#our-story") setPage("story");
      else if (window.location.hash === "#contact") setPage("contact");
      else setPage((current) => (["story", "contact"].includes(current) ? "home" : current));
    };
    window.addEventListener("hashchange", syncInfoRoute);
    return () => window.removeEventListener("hashchange", syncInfoRoute);
  }, []);
  const [selectedProduct, setSelectedProduct] = useState(products[0]);
  const [cart, setCart] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("atelier-wishlist") || "[]").map(Number);
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All pieces");
  const [showCartToast, setShowCartToast] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null);
  const [checkoutFromBag, setCheckoutFromBag] = useState(false);
  const [user, setUser] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [cashfreeReturn, setCashfreeReturn] = useState(() => {
    const orderId = new URLSearchParams(window.location.search).get("order_id");
    return orderId ? { orderId, status: "verifying" } : null;
  });
  // Resume the selected items after returning from Google sign-in.
  const restorePendingCheckout = () => {
    const pending = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (!pending) return;
    try {
      const item = JSON.parse(pending);
      if (item?.id || item?.items?.length) {
        setCheckoutItem(item);
        setPage("checkout");
      }
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    } catch (error) {
      console.error("Unable to restore the pending checkout item.", error);
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  };
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const sessionUser = data.session?.user || null;
        setUser(sessionUser);
        if (sessionUser) restorePendingCheckout();
      })
      .catch((error) => {
        console.error("Unable to restore the Supabase session.", error);
      })
      .finally(() => setAuthLoading(false));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) restorePendingCheckout();
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) {
      setCustomerProfile(null);
      return;
    }
    let active = true;
    supabase
      .from("customers")
      .select("id,full_name,email,phone,address_line1,address_line2,city,state,postal_code")
      .eq("auth_user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Unable to load the saved customer profile.", error);
        if (active) setCustomerProfile(data || null);
      });
    return () => {
      active = false;
    };
  }, [user]);
  useEffect(() => {
    if (!cashfreeReturn || cashfreeReturn.status !== "verifying" || authLoading) return;
    let active = true;
    const verifyPayment = async () => {
      try {
        if (!supabase)
          throw new Error(
            "Payment verification is unavailable. Contact the atelier with your Cashfree order reference.",
          );
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Sign in again to verify this payment.");
        const response = await fetch("/api/payments/cashfree/verify-order", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ orderId: cashfreeReturn.orderId }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "We could not verify this payment yet.");
        if (!active) return;
        setCashfreeReturn({ ...result, orderId: cashfreeReturn.orderId });
        if (result.status === "paid") setCart([]);
      } catch (error) {
        if (active)
          setCashfreeReturn({
            orderId: cashfreeReturn.orderId,
            status: "error",
            message: error.message,
          });
      } finally {
        const cleanUrl = `${window.location.pathname}${window.location.hash}`;
        window.history.replaceState(null, "", cleanUrl);
      }
    };
    verifyPayment();
    return () => {
      active = false;
    };
  }, [authLoading, cashfreeReturn?.orderId, cashfreeReturn?.status]);
  const signInWithGoogle = async () => {
    if (!supabase) {
      setShowCartToast(true);
      console.error("Google sign-in requires Supabase browser credentials.");
      return;
    }
    if (checkoutItem) {
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(checkoutItem));
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setShowCartToast(true);
      console.error("Google sign-in failed.", error);
    }
  };
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Sign out failed.", error);
    else setPage("home");
  };
  useEffect(() => {
    if (!supabase) {
      console.error("Supabase is not configured with browser-safe VITE_ credentials.");
      return;
    }

    let active = true;
    const loadProductImages = async () => {
      let catalog = products;
      const { data: rows, error: catalogError } = await supabase
        .from("products")
        .select("id,name,price,category,image_url,gallery,sizes,tag,description,stock_quantity")
        .eq("is_active", true)
        .order("id");

      if (catalogError) {
        console.warn(
          "Unable to load the products table; using the built-in catalog until the admin schema is applied.",
          catalogError,
        );
      } else if (rows?.length) {
        catalog = rows.map((row) => {
          const image = row.image_url || "/images/logo.webp";
          return {
            ...row,
            image,
            gallery:
              Array.isArray(row.gallery) && row.gallery.length ? row.gallery : [{ src: image }],
            sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : AVAILABLE_SIZES,
            stock_quantity: row.stock_quantity ?? null,
          };
        });
      }

      const { data: rootFiles, error: rootError } = await supabase.storage
        .from(productStorageBucket)
        .list("", { limit: 100 });
      const { data: catalogFiles, error: catalogStorageError } = await supabase.storage
        .from(productStorageBucket)
        .list("catalog", { limit: 100 });
      if (rootError || catalogStorageError)
        console.error(
          "Unable to load product images from Supabase Storage.",
          rootError || catalogStorageError,
        );
      const availableFiles = new Set([
        ...(rootFiles || []).map((file) => file.name),
        ...(catalogFiles || []).map((file) => `catalog/${file.name}`),
      ]);
      const withStorageImages = catalog.map((product) => {
        const gallery = product.gallery.map((image) => {
          const fileName = image.src.replace(PRODUCT_IMG, "");
          if (!availableFiles.has(fileName)) return image;
          return {
            ...image,
            src: supabase.storage.from(productStorageBucket).getPublicUrl(fileName).data.publicUrl,
          };
        });
        const imageFileName = product.image.replace(PRODUCT_IMG, "");
        return {
          ...product,
          image: availableFiles.has(imageFileName)
            ? supabase.storage.from(productStorageBucket).getPublicUrl(imageFileName).data.publicUrl
            : product.image,
          gallery,
        };
      });

      if (active) {
        setProductCatalog(withStorageImages);
        setSelectedProduct(
          (current) => withStorageImages.find((product) => product.id === current.id) || current,
        );
      }
    };

    loadProductImages();
    return () => {
      active = false;
    };
  }, []);
  const navigate = (next, product) => {
    if (product) setSelectedProduct(product);
    const hash = next === "story" ? "#our-story" : next === "contact" ? "#contact" : "";
    if (["#our-story", "#contact"].includes(window.location.hash) || hash)
      window.history.pushState(null, "", window.location.pathname + window.location.search + hash);
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goShop = (cat = "All pieces") => {
    setCategory(cat);
    navigate("shop");
  };
  const startCheckout = (items, fromBag = false) => {
    const checkoutItems = items.map((item) => {
      const catalogItem = productCatalog.find((product) => product.id === item.id);
      return { ...(catalogItem || {}), ...item, quantity: item.quantity || 1 };
    });
    setCheckoutItem({ items: checkoutItems });
    setCheckoutFromBag(fromBag);
    setBagOpen(false);
    setPage("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const buyNow = (product) => startCheckout([product]);
  const checkoutCart = () => startCheckout(cart, true);
  const returnToCart = () => {
    if (checkoutFromBag) {
      setPage("home");
      setBagOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else navigate("home");
  };
  const addToCart = (product) => {
    setCart((old) => {
      const match = old.findIndex(
        (item) =>
          item.id === product.id &&
          item.size === product.size &&
          item.color === product.color &&
          item.personalization === product.personalization,
      );
      if (match < 0) return [...old, { ...product, quantity: product.quantity || 1 }];
      return old.map((item, index) =>
        index === match
          ? { ...item, quantity: (item.quantity || 1) + (product.quantity || 1) }
          : item,
      );
    });
    setShowCartToast(true);
  };
  const toggleWishlist = (product) =>
    setWishlistIds((current) =>
      current.includes(Number(product.id))
        ? current.filter((id) => id !== Number(product.id))
        : [...current, Number(product.id)],
    );
  const isWishlisted = (id) => wishlistIds.includes(Number(id));
  const wishlistProducts = productCatalog.filter((product) => isWishlisted(product.id));
  useEffect(() => {
    localStorage.setItem("atelier-wishlist", JSON.stringify(wishlistIds));
  }, [wishlistIds]);
  const removeFromCart = (index) =>
    setCart((old) => old.filter((_, itemIndex) => itemIndex !== index));
  const changeCartQuantity = (index, delta) =>
    setCart((old) =>
      old.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item,
      ),
    );
  useEffect(() => {
    if (!showCartToast) return;
    const t = setTimeout(() => setShowCartToast(false), 3000);
    return () => clearTimeout(t);
  }, [showCartToast, cart.length]);
  if (adminMode)
    return (
      <AdminPanel
        products={productCatalog}
        onProductsChange={(updated) => {
          setProductCatalog(updated);
          setSelectedProduct(
            (current) => updated.find((product) => product.id === current.id) || current,
          );
        }}
        onExit={() => {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          setAdminMode(false);
        }}
      />
    );
  return (
    <>
      <Header
        page={page}
        navigate={navigate}
        goShop={goShop}
        cartCount={cart.reduce((n, p) => n + (p.quantity || 1), 0)}
        wishlistCount={wishlistIds.length}
        search={search}
        setSearch={setSearch}
        onBag={() => setBagOpen(true)}
        onWishlist={() => navigate("wishlist")}
        user={user}
      />
      {cashfreeReturn ? (
        <main className="checkout-page">
          <section className="checkout-success" aria-live="polite">
            <span>
              {cashfreeReturn.status === "paid" ? <Check size={23} /> : <ShieldCheck size={22} />}
            </span>
            <h2>
              {cashfreeReturn.status === "paid"
                ? "Payment confirmed"
                : cashfreeReturn.status === "verifying"
                  ? "Verifying your payment"
                  : cashfreeReturn.status === "pending"
                    ? "Payment is processing"
                    : "Payment needs confirmation"}
            </h2>
            <p>
              {cashfreeReturn.status === "paid"
                ? "Cashfree confirmed your payment. Your order is now being prepared."
                : cashfreeReturn.status === "verifying"
                  ? "We’re checking your payment securely with Cashfree."
                  : cashfreeReturn.status === "pending"
                    ? "Cashfree has not confirmed the payment yet. Check again shortly."
                    : cashfreeReturn.message ||
                      "If your account was charged, please contact the atelier with this order reference."}
            </p>
            <small>Order reference: {cashfreeReturn.orderId}</small>
            {cashfreeReturn.status !== "paid" && (
              <button
                className="checkout-back-link"
                type="button"
                onClick={() =>
                  setCashfreeReturn((current) => ({ ...current, status: "verifying", message: "" }))
                }
              >
                Check payment status
              </button>
            )}
            <button
              className="story-cta checkout-submit"
              type="button"
              onClick={() => {
                setCashfreeReturn(null);
                navigate("home");
              }}
            >
              Continue shopping <ArrowRight size={15} />
            </button>
          </section>
        </main>
      ) : (
        <>
          {page === "home" && (
            <Home
              navigate={navigate}
              onOpen={(p) => navigate("product", p)}
              onAdd={addToCart}
              goShop={goShop}
              search={search}
              productCatalog={productCatalog}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
            />
          )}
          {page === "story" && <OurStory goShop={goShop} />}
          {page === "contact" && <ContactUs contact={SOCIAL} />}
          {page === "shop" && (
            <Shop
              onOpen={(p) => navigate("product", p)}
              onAdd={addToCart}
              search={search}
              category={category}
              setCategory={setCategory}
              productCatalog={productCatalog}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
            />
          )}
          {page === "product" && (
            <ProductDetail
              key={selectedProduct.id}
              product={selectedProduct}
              onAdd={addToCart}
              onBuyNow={buyNow}
              navigate={navigate}
              goShop={goShop}
              productCatalog={productCatalog}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
            />
          )}
          {page === "wishlist" && (
            <Wishlist
              products={wishlistProducts}
              onOpen={(p) => navigate("product", p)}
              onAdd={addToCart}
              isWishlisted={isWishlisted}
              onToggleWishlist={toggleWishlist}
              onShop={() => goShop()}
            />
          )}
          {page === "account" &&
            (user ? (
              <CustomerAccount
                user={user}
                customerProfile={customerProfile}
                productCatalog={productCatalog}
                onSignOut={signOut}
                onShop={() => goShop()}
              />
            ) : (
              <main className="account-signin-page">
                <GoogleSignInScreen onGoogleSignIn={signInWithGoogle} />
              </main>
            ))}
          {page === "checkout" && checkoutItem && (
            <Checkout
              item={checkoutItem}
              user={user}
              customerProfile={customerProfile}
              authLoading={authLoading}
              onBackToCart={returnToCart}
              onPlaceOrder={async (details, coupon) => {
                if (!supabase)
                  return {
                    error: "Online payment is unavailable because Supabase is not configured.",
                  };
                const {
                  data: { session },
                } = await supabase.auth.getSession();
                if (!session?.access_token)
                  return {
                    error: "Your sign-in has expired. Sign in again to continue with payment.",
                  };
                const response = await fetch("/api/payments/cashfree/create-order", {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    authorization: `Bearer ${session.access_token}`,
                  },
                  body: JSON.stringify({
                    details,
                    coupon,
                    items: (checkoutItem.items || [checkoutItem]).map((product) => ({
                      product_id: product.id,
                      quantity: product.quantity || 1,
                      size: product.size || null,
                      color: product.color || null,
                      personalization: product.personalization || null,
                    })),
                  }),
                });
                const result = await response.json().catch(() => ({}));
                return response.ok
                  ? result
                  : {
                      error:
                        result.error || "Cashfree could not start the payment. Please try again.",
                    };
              }}
              onGoogleSignIn={signInWithGoogle}
            />
          )}
          {bagOpen && (
            <>
              <button
                className="cart-backdrop"
                aria-label="Close shopping bag"
                onClick={() => setBagOpen(false)}
              />
              <CartDrawer
                cart={cart}
                onClose={() => setBagOpen(false)}
                onRemove={removeFromCart}
                onQuantityChange={changeCartQuantity}
                onCheckout={checkoutCart}
              />
            </>
          )}
          {showCartToast && (
            <div className="cart-toast" role="status">
              <ShoppingBag size={16} />
              <span>Added to your bag</span>
              <button onClick={() => setShowCartToast(false)}>Dismiss</button>
            </div>
          )}
        </>
      )}
      <Footer goShop={goShop} navigate={navigate} />
      <FloatingSocials />
    </>
  );
}
