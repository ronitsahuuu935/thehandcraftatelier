import React, { useRef, useState } from "react";

import { Heart, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { isVideo } from "../data/media.js";

import { money } from "../lib/format.js";
import { canPurchase } from "../lib/inventory.js";
import { responsiveImageProps } from "../lib/responsive-images.js";

export function ProductCard({ product, onOpen, onAdd, isWishlisted, onToggleWishlist }) {
  const photos = [
    ...new Set(
      [
        product.image,
        ...(product.gallery || []).filter((item) => !isVideo(item)).map((item) => item.src),
      ].filter(Boolean),
    ),
  ];
  const [activePhoto, setActivePhoto] = useState(0);
  const gesture = useRef(null);
  const swiped = useRef(false);
  const index = activePhoto % Math.max(1, photos.length);
  const changePhoto = (direction) =>
    setActivePhoto((current) => (current + direction + photos.length) % photos.length);
  return (
    <article className="product-card">
      <div className="product-image">
        <button
          type="button"
          className="product-photo-open"
          onClick={() => {
            if (swiped.current) {
              swiped.current = false;
              return;
            }
            onOpen(product);
          }}
          aria-label={`View ${product.name}`}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (photos.length > 1 && ["ArrowLeft", "ArrowRight"].includes(e.key)) {
              e.preventDefault();
              changePhoto(e.key === "ArrowLeft" ? -1 : 1);
            }
          }}
        >
          <img
            key={photos[index]}
            src={photos[index]}
            {...responsiveImageProps(photos[index])}
            alt={`${product.name} — photo ${index + 1} of ${photos.length}`}
            draggable={false}
            onPointerDown={(event) => {
              swiped.current = false;
              if (!event.isPrimary || event.button !== 0 || photos.length < 2) return;
              gesture.current = { x: event.clientX, y: event.clientY };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              if (!gesture.current) return;
              const dx = event.clientX - gesture.current.x;
              const dy = event.clientY - gesture.current.y;
              gesture.current = null;
              if (Math.abs(dx) >= 35 && Math.abs(dx) > Math.abs(dy)) {
                swiped.current = true;
                changePhoto(dx < 0 ? 1 : -1);
              }
            }}
            onPointerCancel={() => {
              gesture.current = null;
            }}
            loading="lazy"
            style={product.pos ? { objectPosition: product.pos } : undefined}
            onError={(e) => {
              e.currentTarget.style.opacity = ".15";
            }}
          />
        </button>
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className="product-photo-arrow previous"
              aria-label={`Previous photo of ${product.name}`}
              onClick={(event) => {
                event.stopPropagation();
                changePhoto(-1);
              }}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="product-photo-arrow next"
              aria-label={`Next photo of ${product.name}`}
              onClick={(event) => {
                event.stopPropagation();
                changePhoto(1);
              }}
            >
              <ChevronRight size={18} />
            </button>
            <span className="product-photo-count" aria-live="polite" aria-atomic="true">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <button
          className={"wishlist " + (isWishlisted ? "liked" : "")}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
        >
          <Heart size={17} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-info">
        <button className="product-name" onClick={() => onOpen(product)}>
          {product.name}
        </button>
        <strong>{money(product.price)}</strong>
        <p className="product-craft-note">Handcrafted with care</p>
        <button
          className="quick-add"
          disabled={!canPurchase(product)}
          onClick={() => onAdd(product)}
        >
          {canPurchase(product) ? "Add to bag" : "Out of stock"} <Plus size={13} />
        </button>
      </div>
    </article>
  );
}
