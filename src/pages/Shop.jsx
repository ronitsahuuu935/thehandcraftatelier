import React, { useMemo, useState } from "react";

import { X, SlidersHorizontal } from "lucide-react";

import { images, CATEGORIES } from "../data/storefront.js";

import { money } from "../lib/format.js";

import { ProductGrid } from "../components/ProductGrid.jsx";

export function Shop({
  onOpen,
  onAdd,
  search,
  category,
  setCategory,
  productCatalog,
  isWishlisted,
  onToggleWishlist,
  loading = false,
}) {
  const [sort, setSort] = useState("Featured");
  const [filterOpen, setFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(2500);
  const filtered = useMemo(() => {
    let list = productCatalog.filter(
      (p) =>
        (category === "All pieces" || p.category === category) &&
        p.price <= maxPrice &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    );
    if (sort === "Price: Low to High") list.sort((a, b) => a.price - b.price);
    if (sort === "Price: High to Low") list.sort((a, b) => b.price - a.price);
    return list;
  }, [category, sort, maxPrice, search, productCatalog]);
  return (
    <main className="shop-page">
      <section className="shop-banner">
        <img src={images.heroBg} alt="" />
        <div>
          <span className="eyebrow">THOUGHTFULLY HANDMADE</span>
          <h1>Shop All Handcrafted Pieces</h1>
          <p>
            Discover unique embroidery and handcrafted pieces designed to bring beauty to your
            everyday life.
          </p>
        </div>
      </section>
      <div className="breadcrumbs">
        Home <span>/</span> Shop
      </div>
      <div className="shop-layout">
        <aside className={filterOpen ? "filters show" : "filters"}>
          <div className="filter-head">
            <h3>Filter</h3>
            <button
              onClick={() => {
                setCategory("All pieces");
                setMaxPrice(2500);
              }}
            >
              Clear all
            </button>
            <button className="filter-close" onClick={() => setFilterOpen(false)}>
              <X size={17} />
            </button>
          </div>
          <div className="filter-group">
            <h4>Category</h4>
            {[
              "All pieces",
              ...new Set([...CATEGORIES, ...productCatalog.map((product) => product.category)]),
            ].map((c) => (
              <label key={c}>
                <input type="radio" checked={category === c} onChange={() => setCategory(c)} />
                {c}
              </label>
            ))}
          </div>
          <div className="filter-group">
            <h4>
              Price <span>{money(maxPrice)}</span>
            </h4>
            <input
              className="range"
              type="range"
              min="1000"
              max="2500"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(+e.target.value)}
            />
            <div className="range-labels">
              <span>₹1,000</span>
              <span>₹2,500</span>
            </div>
          </div>
        </aside>
        <section
          className="shop-results"
          style={loading ? { minHeight: "100vh" } : undefined}
          aria-busy={loading}
        >
          <div className="shop-toolbar">
            <button className="filter-trigger" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={16} /> Filter & sort
            </button>
            <span>{filtered.length} thoughtfully made pieces</span>
            <label className="sort-label">
              Sort by{" "}
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </label>
          </div>
          <ProductGrid
            items={filtered}
            onOpen={onOpen}
            onAdd={onAdd}
            isWishlisted={isWishlisted}
            onToggleWishlist={onToggleWishlist}
          />
          {filtered.length === 0 && (
            <div className="empty-state">
              No pieces match those filters. Try clearing your filters.
            </div>
          )}
        </section>
      </div>
      <section className="gift-banner">
        <img
          src={images.gift}
          alt="Hand-embroidered hoop with a hand holding coral flowers on peach fabric"
          style={{ objectPosition: "50% 58%" }}
          loading="lazy"
        />
        <div>
          <span className="eyebrow">GIVE SOMETHING MEANINGFUL</span>
          <h2>The Perfect Gift</h2>
          <p>Thoughtful. Handmade. Meaningful.</p>
        </div>
      </section>
    </main>
  );
}
