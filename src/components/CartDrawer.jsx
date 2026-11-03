import React from "react";

import { ShoppingBag, X, ArrowRight, Plus, Minus } from "lucide-react";

import { money } from "../lib/format.js";

export function CartDrawer({ cart, onClose, onRemove, onQuantityChange, onCheckout }) {
  const subtotal = cart.reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  return (
    <aside className="cart-drawer" aria-label="Shopping bag">
      <div className="cart-drawer-head">
        <div>
          <span className="eyebrow">YOUR ATELIER BAG</span>
          <h2>
            Your bag <small>({cart.reduce((n, item) => n + (item.quantity || 1), 0)})</small>
          </h2>
        </div>
        <button className="cart-close" aria-label="Close shopping bag" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {cart.length === 0 ? (
        <div className="cart-empty">
          <ShoppingBag size={30} />
          <p>Your bag is waiting for something lovely.</p>
          <button className="story-cta" onClick={onClose}>
            Continue shopping <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item, index) => (
              <article
                className="cart-item"
                key={`${item.id}-${item.size || ""}-${item.color || ""}-${item.personalization || ""}-${index}`}
              >
                <img src={item.image} alt={item.name} />
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  {item.size && <small>Size: {item.size}</small>}
                  {item.color && <small>Color: {item.color}</small>}
                  {item.personalization && <small>Personalized: {item.personalization}</small>}
                  <strong>{money(item.price)}</strong>
                  <div className="cart-item-actions">
                    <div className="quantity">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => onQuantityChange(index, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.quantity || 1}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => onQuantityChange(index, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button className="cart-remove" onClick={() => onRemove(index)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="cart-summary">
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <small>Shipping calculated at checkout. Complimentary shipping above ₹2,000.</small>
            <button className="story-cta cart-checkout" onClick={onCheckout}>
              Proceed to checkout <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
