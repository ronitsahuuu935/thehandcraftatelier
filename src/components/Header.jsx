import React, { useState } from "react";

import { Search, UserRound, Heart, ShoppingBag, Menu, X } from "lucide-react";

export function Header({
  page,
  navigate,
  goShop,
  cartCount,
  wishlistCount,
  search,
  setSearch,
  onBag,
  onWishlist,
  user,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="announcement">
        A little love, in every stitch. Complimentary shipping on orders ₹2,000+
      </div>
      <div className="brandbar">
        <button
          className="icon-btn mobile-menu"
          aria-label="Open menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
        <button className="wordmark" onClick={() => navigate("home")}>
          <span>The Hand Craft Atelier</span>
          <small>HANDMADE · HEARTFELT · FOREVER</small>
        </button>
        <div className="search-inline">
          <Search size={17} />
          <input
            placeholder="Find something lovely"
            aria-label="Search products"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value && page === "product") navigate("shop");
            }}
          />
        </div>
        <div className="header-actions">
          <button
            className={user ? "icon-btn profile-trigger signed-in" : "icon-btn profile-trigger"}
            aria-label={user ? "Open your account" : "Sign in to your account"}
            title={user ? "My profile" : "Sign in to your account"}
            onClick={() => navigate("account")}
          >
            <UserRound />
          </button>
          <button
            className="icon-btn wishlist-header-button"
            aria-label={`Open wishlist, ${wishlistCount} items`}
            title="Wishlist"
            onClick={onWishlist}
          >
            <Heart />
            <span>{wishlistCount}</span>
          </button>
          <button
            className="icon-btn bag"
            aria-label={`Open shopping bag, ${cartCount} items`}
            onClick={onBag}
          >
            <ShoppingBag />
            <span>{cartCount}</span>
          </button>
        </div>
      </div>
      <nav className={menuOpen ? "main-nav open" : "main-nav"}>
        <button
          className={page === "home" ? "active" : ""}
          onClick={() => {
            navigate("home");
            setMenuOpen(false);
          }}
        >
          Home
        </button>
        <button
          className={page === "shop" ? "active" : ""}
          onClick={() => {
            goShop();
            setMenuOpen(false);
          }}
        >
          Shop
        </button>
        <button
          onClick={() => {
            goShop("Shirts");
            setMenuOpen(false);
          }}
        >
          Shirts
        </button>
        <button
          onClick={() => {
            goShop();
            setMenuOpen(false);
          }}
        >
          Personalized
        </button>
        <button
          className={page === "story" ? "active" : ""}
          onClick={() => {
            navigate("story");
            setMenuOpen(false);
          }}
        >
          Our Story
        </button>
      </nav>
    </header>
  );
}
