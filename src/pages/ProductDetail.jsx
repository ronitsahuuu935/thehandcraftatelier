import React, { useEffect, useState } from "react";

import { Heart, ArrowRight, Plus, Minus, Play, X } from "lucide-react";
import { isVideo } from "../data/media.js";

import { AVAILABLE_SIZES, images } from "../data/storefront.js";
import { whatsappProductUrl } from "../lib/product-sharing.js";

import { money } from "../lib/format.js";
import { canPurchase } from "../lib/inventory.js";
import { responsiveImageProps } from "../lib/responsive-images.js";

import { ProductGrid } from "../components/ProductGrid.jsx";

export function ProductDetail({
  product,
  onAdd,
  onBuyNow,
  navigate,
  goShop,
  productCatalog,
  isWishlisted,
  onToggleWishlist,
}) {
  const sizes =
    Array.isArray(product.sizes) && product.sizes.length ? product.sizes : AVAILABLE_SIZES;
  const colorOptions = [
    ...new Set(
      (product.gallery || []).map((image) => String(image.color || "").trim()).filter(Boolean),
    ),
  ];
  const [size, setSize] = useState(sizes[0]);
  const [color, setColor] = useState(colorOptions[0] || "");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("Details");
  const [personalization, setPersonalization] = useState("");
  const gallery = (product.gallery || []).filter(
    (image) => !color || String(image.color || "").trim() === color,
  );
  const [active, setActive] = useState(0);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState(null);
  useEffect(() => {
    if (!imageExpanded) return;
    const closeOnEscape = (event) => event.key === "Escape" && setImageExpanded(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [imageExpanded]);
  return (
    <main className="detail-page">
      <div className="breadcrumbs">
        <button type="button" onClick={() => navigate("home")}>
          Home
        </button>
        <span>/</span>
        <button type="button" onClick={() => goShop()}>
          Shop
        </button>
        <span>/</span>
        <span className="breadcrumbs-current" aria-current="page">
          {product.name}
        </span>
      </div>
      <div className="detail-layout">
        <div className={"detail-gallery" + (gallery.length > 1 ? "" : " single")}>
          {gallery.length > 1 && (
            <div className="thumbs">
              {gallery.map((src, i) => (
                <button
                  key={`${src.src}-${i}`}
                  className={i === active ? "chosen" : ""}
                  aria-label={
                    isVideo(src)
                      ? `Play product video ${i + 1}`
                      : src.color
                        ? `View ${src.color} image`
                        : `View image ${i + 1}`
                  }
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  <img
                    src={isVideo(src) ? src.poster || product.image : src.src}
                    {...responsiveImageProps(
                      isVideo(src) ? src.poster || product.image : src.src,
                      "65px",
                    )}
                    alt=""
                  />
                  {isVideo(src) && (
                    <Play className="product-video-badge" size={18} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="detail-main-image">
            {isVideo(gallery[active]) ? (
              <video
                key={gallery[active].src}
                src={gallery[active].src}
                poster={gallery[active].poster || product.image}
                controls
                playsInline
                preload="none"
                aria-label={`${product.name} video`}
              />
            ) : (
              <button
                className={`detail-image-zoom${zoomOrigin ? " is-zooming" : ""}`}
                type="button"
                onClick={() => setImageExpanded(true)}
                onPointerMove={(event) => {
                  if (event.pointerType !== "mouse") return;
                  const bounds = event.currentTarget.getBoundingClientRect();
                  setZoomOrigin({
                    x: `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
                    y: `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
                  });
                }}
                onPointerLeave={() => setZoomOrigin(null)}
                aria-label="Hover to zoom; click to enlarge product image"
              >
                <img
                  src={gallery[active]?.src || product.image}
                  {...responsiveImageProps(
                    gallery[active]?.src || product.image,
                    "(max-width: 900px) 90vw, 50vw",
                  )}
                  fetchPriority="high"
                  alt={product.name}
                  style={
                    zoomOrigin ? { transformOrigin: `${zoomOrigin.x} ${zoomOrigin.y}` } : undefined
                  }
                />
              </button>
            )}
          </div>
        </div>
        <div className="detail-info">
          <span className="eyebrow">MADE SLOWLY, KEPT FOREVER</span>
          <div className="detail-title-row">
            <h1>{product.name}</h1>
            <button
              className={"wishlist detail-wishlist " + (isWishlisted(product.id) ? "liked" : "")}
              aria-label={isWishlisted(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              onClick={() => onToggleWishlist(product)}
            >
              <Heart size={20} fill={isWishlisted(product.id) ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="product-craft-note">Hand-embroidered with care</p>
          <div className="detail-price">{money(product.price)}</div>
          <p className="detail-description">
            {product.description ||
              "Hand-embroidered with care, stitch by stitch. A little everyday beauty you can wear."}
          </p>
          <div className="option-label">Size</div>
          <div className="size-options">
            {sizes.map((s) => (
              <button key={s} className={size === s ? "selected" : ""} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
          {colorOptions.length > 0 && (
            <>
              <div className="option-label color-option-label">
                Color <strong>{color}</strong>
              </div>
              <div className="color-options">
                {colorOptions.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className={color === name ? "selected" : ""}
                    onClick={() => {
                      setColor(name);
                      setActive(0);
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </>
          )}
          <label className="personal-label">
            Personalization <span>Optional</span>
            <input
              value={personalization}
              onChange={(e) => setPersonalization(e.target.value)}
              placeholder="Add a name or short message"
            />
          </label>
          <div className="option-label">Quantity</div>
          <div className="quantity">
            <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))}>
              <Minus size={14} />
            </button>
            <span>{qty}</span>
            <button
              aria-label="Increase quantity"
              disabled={!canPurchase(product, qty + 1)}
              onClick={() => setQty(qty + 1)}
            >
              <Plus size={14} />
            </button>
          </div>
          <button
            className="btn primary add-large"
            disabled={!canPurchase(product, qty)}
            onClick={() =>
              onAdd({ ...product, quantity: qty, size, color: color || null, personalization })
            }
          >
            {canPurchase(product) ? `Add to bag — ${money(product.price * qty)}` : "Out of stock"}
          </button>
          <button
            className="btn secondary buy-large"
            disabled={!canPurchase(product, qty)}
            onClick={() =>
              onBuyNow({ ...product, quantity: qty, size, color: color || null, personalization })
            }
          >
            Buy now
          </button>
          <div className="trust-row">
            <span>♡ Handmade with care</span>
            <span>♧ Dispatch in 5–7 days</span>
            <span>✧ Free shipping on orders ₹1,998+</span>
          </div>
          <a
            className="product-whatsapp-share"
            href={whatsappProductUrl(
              product,
              typeof window === "undefined"
                ? "https://thehandcraftatelier.live"
                : window.location.origin,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={images.whatsapp} alt="" />
            Share on WhatsApp
          </a>
          <div className="detail-tabs">
            {["Details", "Shipping", "Care"].map((t) => (
              <button
                key={t}
                className={activeTab === t ? "selected" : ""}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="tab-content">
            {activeTab === "Details"
              ? "Soft, breathable fabric with hand embroidery in cotton thread. Each piece is finished by hand, so small variations make it yours."
              : activeTab === "Shipping"
                ? "Carefully packed and dispatched in 5–7 business days. Shipping is ₹60 below ₹1,998 (₹50 in Jaipur) and free on orders of ₹1,998 or more."
                : "Gentle hand wash in cold water. Do not wring or bleach. Dry in shade and iron on the reverse side."}
          </div>
        </div>
      </div>
      {imageExpanded && !isVideo(gallery[active]) && (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image`}
          onClick={() => setImageExpanded(false)}
        >
          <button
            type="button"
            className="product-image-lightbox-close"
            aria-label="Close enlarged image"
            onClick={() => setImageExpanded(false)}
          >
            <X size={24} />
          </button>
          <img
            src={gallery[active]?.src || product.image}
            alt={product.name}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
      <section className="section-wrap related">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A FEW MORE LOVELY THINGS</span>
            <h2>You may also like</h2>
          </div>
          <button className="text-link" onClick={() => goShop()}>
            Shop all <ArrowRight size={15} />
          </button>
        </div>
        <ProductGrid
          items={productCatalog.filter((p) => p.id !== product.id).slice(0, 4)}
          onOpen={(p) => navigate("product", p)}
          onAdd={onAdd}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      </section>
    </main>
  );
}
