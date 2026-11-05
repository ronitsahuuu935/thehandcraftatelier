import React from "react";

import { Heart, Plus } from "lucide-react";

import { money } from "../lib/format.js";
import { canPurchase } from "../lib/inventory.js";

export function ProductCard({ product, onOpen, onAdd, isWishlisted, onToggleWishlist }) {
  return (
    <article className="product-card">
      <div
        className="product-image"
        onClick={() => onOpen(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onOpen(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          style={product.pos ? { objectPosition: product.pos } : undefined}
          onError={(e) => {
            e.currentTarget.style.opacity = ".15";
          }}
        />
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
