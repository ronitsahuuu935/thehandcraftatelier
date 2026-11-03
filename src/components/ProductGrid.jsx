import React from "react";

import { ProductCard } from "./ProductCard.jsx";

export function ProductGrid({ items, onOpen, onAdd, isWishlisted, onToggleWishlist }) {
  return (
    <div className="product-grid">
      {items.map((p) => (
        <ProductCard
          key={p.id}
          product={p}
          onOpen={onOpen}
          onAdd={onAdd}
          isWishlisted={isWishlisted(p.id)}
          onToggleWishlist={onToggleWishlist}
        />
      ))}
    </div>
  );
}
