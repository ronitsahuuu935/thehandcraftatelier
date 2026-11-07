import React from "react";

import { Leaf, ArrowRight } from "lucide-react";

import DesignGallery from "../DesignGallery";
import { images } from "../data/storefront.js";
import { responsiveImageProps } from "../lib/responsive-images.js";

import { ProductGrid } from "../components/ProductGrid.jsx";

export function Home({
  onOpen,
  onAdd,
  goShop,
  navigate,
  search,
  productCatalog,
  isWishlisted,
  onToggleWishlist,
  loading = false,
}) {
  const visible = productCatalog.filter(
    (product) =>
      product.category !== "Accessories" &&
      product.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <img
            className="hero-logo"
            src={images.logo}
            {...responsiveImageProps(images.logo, "180px")}
            alt="The Hand Craft Atelier embroidered logo"
          />
          <span className="eyebrow">Stitched to Stand Out</span>
          <h1>
            Not Just Thread.
            <br />A Work of Art.
          </h1>
          <p>Timeless embroidery. Thoughtful details. Pieces made just for you.</p>
          <button className="btn primary" onClick={() => goShop()}>
            <span className="hero-button-embroidery" aria-hidden="true">
              <img
                src={images.promiseEmbroideryHoop}
                {...responsiveImageProps(images.promiseEmbroideryHoop, "38px")}
                alt=""
                width="38"
                height="38"
              />
            </span>
            Explore the collection <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          className="hero-bg"
          role="img"
          aria-label="Embroidery threads, scissors and blush flowers resting on soft cream fabric"
          style={{ backgroundImage: `url(${images.heroBg})` }}
        ></div>
        <img className="hero-needle" src={images.needle} alt="" aria-hidden="true" />
      </section>
      <section className="category-row">
        {[
          ["Shirts", images.catShirts],
          ["Tops & Tees", images.catTops],
          ["Kids", images.catKids],
          ["Personalized", images.catPersonalized],
        ].map(([name, img]) => {
          const candidates = productCatalog.filter((product) => product.category === name);
          if (!candidates.length && !loading) return null;
          const image =
            candidates.find((product) => product.image.split("?")[0].endsWith(img.split("/").pop()))
              ?.image || candidates[0]?.image;
          return (
            <button className="category-card" key={name} onClick={() => goShop(name)}>
              {image ? (
                <img
                  src={image}
                  {...responsiveImageProps(image)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div style={{ height: "var(--category-image-height)" }} aria-hidden="true" />
              )}
              <span>
                {name}
                <small>Shop now ↗</small>
              </span>
            </button>
          );
        })}
      </section>
      <section className="section-wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FROM THE ATELIER</span>
            <h2>Featured Pieces</h2>
            <p>Thoughtfully stitched designs from the collection.</p>
          </div>
          <button className="text-link" onClick={() => goShop()}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <ProductGrid
          items={visible.slice(0, 4)}
          onOpen={onOpen}
          onAdd={onAdd}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      </section>
      <section className="section-wrap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">FRESH FROM THE ATELIER</span>
            <h2>New Arrivals</h2>
            <p>Fresh designs for your special moments.</p>
          </div>
          <button className="text-link" onClick={() => goShop()}>
            View all <ArrowRight size={15} />
          </button>
        </div>
        <ProductGrid
          items={visible.slice(4, 8).length ? visible.slice(4, 8) : visible.slice(0, 4)}
          onOpen={onOpen}
          onAdd={onAdd}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
        />
      </section>
      <DesignGallery goShop={goShop} onStory={() => navigate("story")} />
      <section className="testimonial">
        <div className="testimonial-copy">
          <span className="eyebrow">
            <Leaf size={24} />
            OUR PROMISE
          </span>
          <h2>
            Made with <em>thoughtful</em> detail
          </h2>
          <blockquote>
            <span className="quote-mark">“</span>
            <span>
              Every piece is stitched slowly, with care in every detail.
              <br />
              Made to be worn, gifted, and kept close.
            </span>
          </blockquote>
          <p className="testimonial-author">
            <span className="author-mark">
              <Leaf size={18} />
            </span>{" "}
            Handmade, heartfelt, forever
          </p>
        </div>
        <div className="testimonial-art">
          <img
            src={images.promiseEmbroideryHoop}
            {...responsiveImageProps(
              images.promiseEmbroideryHoop,
              "(max-width: 620px) 270px, 40vw",
            )}
            alt="Hand-embroidered tree with colourful flowers"
            loading="lazy"
          />
        </div>
      </section>
      <section className="journal-strip" id="journal">
        <img
          src={images.journal2}
          {...responsiveImageProps(images.journal2, "(max-width: 620px) 90vw, 40vw")}
          alt="Hand-embroidered hoop with tiny birds and flowers on turquoise fabric"
          style={{ objectPosition: "center 52%" }}
          loading="lazy"
        />
        <div>
          <span className="eyebrow">
            NOTES FROM THE ATELIER <i />
          </span>
          <h2>
            Made to be <em>kept close.</em>
          </h2>
          <p>Thoughtful gifts, little rituals, and the beauty of making things slowly.</p>
          <button className="story-cta" onClick={() => goShop()}>
            Shop now <ArrowRight size={15} />
          </button>
        </div>
        <div className="journal-decoration" aria-hidden="true" />
        <Leaf className="journal-sprig sprig-left" aria-hidden="true" />
        <Leaf className="journal-sprig sprig-right" aria-hidden="true" />
        <span className="journal-heart" aria-hidden="true">
          ♡
        </span>
      </section>
    </main>
  );
}
