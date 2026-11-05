import React, { useState } from "react";

import { Heart, ArrowRight, Plus, Minus, Play } from "lucide-react";
import { isVideo } from "../data/media.js";

import { AVAILABLE_SIZES } from "../data/storefront.js";

import { money } from "../lib/format.js";
import { canPurchase } from "../lib/inventory.js";

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
  const gallery = product.gallery;
  const [active, setActive] = useState(
    Math.max(
      0,
      product.gallery.findIndex((image) => color && String(image.color || "").trim() === color),
    ),
  );
  return (
    <main className="detail-page">
      <div className="breadcrumbs">
        Home <span>/</span> Shop <span>/</span> {product.name}
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
                  onClick={() => {
                    setActive(i);
                    if (src.color) setColor(src.color);
                  }}
                >
                  <img
                    src={isVideo(src) ? src.poster || product.image : src.src}
                    alt=""
                    style={{ "--gallery-image-fit": src.contain ? "contain" : "cover" }}
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
              <img
                src={gallery[active]?.src || product.image}
                alt={product.name}
                style={{ "--gallery-image-fit": gallery[active]?.contain ? "contain" : "cover" }}
              />
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
                      const imageIndex = gallery.findIndex(
                        (image) => String(image.color || "").trim() === name,
                      );
                      if (imageIndex >= 0) setActive(imageIndex);
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
            <button onClick={() => setQty(Math.max(1, qty - 1))}>
              <Minus size={14} />
            </button>
            <span>{qty}</span>
            <button disabled={!canPurchase(product, qty + 1)} onClick={() => setQty(qty + 1)}>
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
            <span>✧ Free shipping above ₹2,000</span>
          </div>
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
                ? "Carefully packed and dispatched in 5–7 business days. Complimentary shipping on orders above ₹2,000."
                : "Gentle hand wash in cold water. Do not wring or bleach. Dry in shade and iron on the reverse side."}
          </div>
        </div>
      </div>
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
