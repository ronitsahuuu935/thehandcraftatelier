import React, { useEffect, useState } from "react";
import "./story.css";
import { ArrowRight, X } from "lucide-react";
import { designs } from "./data/designs.js";
import { responsiveImageProps } from "./lib/responsive-images.js";

export default function DesignGallery({ goShop, onStory, full = false }) {
  const [expandedDesign, setExpandedDesign] = useState(null);
  const featured = [24, 33, 26, 27, 28, 29, 30, 31].map((id) =>
    designs.find((design) => design.id === id),
  );
  const storyImageExclusions = new Set([
    "Tree of blooms",
    "Peacock garden",
    "Woodland deer",
    "Floral garland",
    "Garden songbird",
  ]);
  const galleryDesigns = full
    ? designs.filter((design) => !storyImageExclusions.has(design.name))
    : featured;

  useEffect(() => {
    if (!expandedDesign) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setExpandedDesign(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [expandedDesign]);

  return (
    <section className="section-wrap embroidery-gallery">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A CLOSER LOOK AT OUR CRAFT</span>
          <h2>Little stitches. Endless stories.</h2>
          <p>
            {full
              ? "Our collection of stitched stories — every bird, bloom, and woodland friend."
              : "A few favourites from our embroidery collection."}
          </p>
        </div>
      </div>
      <div className="embroidery-gallery-grid">
        {galleryDesigns.map((design) => (
          <figure key={design.id}>
            <button
              className="embroidery-gallery-image-button"
              type="button"
              aria-label={`Enlarge ${design.name}`}
              onClick={() => setExpandedDesign(design)}
            >
              <img
                src={design.src}
                {...responsiveImageProps(design.src)}
                alt={`Hand embroidery: ${design.name}`}
                loading="lazy"
                decoding="async"
              />
            </button>
            <figcaption>{design.name}</figcaption>
          </figure>
        ))}
      </div>
      {expandedDesign && (
        <div
          className="product-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged image: ${expandedDesign.name}`}
          onClick={() => setExpandedDesign(null)}
        >
          <button
            className="product-image-lightbox-close"
            type="button"
            aria-label="Close enlarged image"
            onClick={() => setExpandedDesign(null)}
          >
            <X size={24} />
          </button>
          <img
            src={expandedDesign.src}
            {...responsiveImageProps(expandedDesign.src)}
            alt={`Hand embroidery: ${expandedDesign.name}`}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
      <div className="embroidery-gallery-actions">
        {!full && onStory && (
          <button className="text-link" onClick={onStory}>
            Explore all {designs.length} designs & our story <ArrowRight size={15} />
          </button>
        )}
        <button className="text-link" onClick={() => goShop("Personalized")}>
          Shop personalized pieces <ArrowRight size={15} />
        </button>
      </div>
    </section>
  );
}
