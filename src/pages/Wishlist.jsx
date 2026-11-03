import React from "react";

import { Heart, ArrowRight } from "lucide-react";

import { ProductGrid } from "../components/ProductGrid.jsx";

export function Wishlist({ products, onOpen, onAdd, isWishlisted, onToggleWishlist, onShop }) {
  return (
    <main className="wishlist-page">
      <div className="wishlist-page-heading">
        <span className="eyebrow">SAVED WITH LOVE</span>
        <h1>Your Wishlist</h1>
        <p>Keep the pieces you would love to bring home.</p>
      </div>
      {products.length ? (
        <ProductGrid
          items={products}
          onOpen={onOpen}
          onAdd={onAdd}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      ) : (
        <div className="wishlist-empty">
          <Heart size={30} />
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any product to save it here.</p>
          <button className="btn primary" onClick={onShop}>
            Explore the collection <ArrowRight size={16} />
          </button>
        </div>
      )}
    </main>
  );
}
