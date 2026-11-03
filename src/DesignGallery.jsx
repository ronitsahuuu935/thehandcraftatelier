import React from "react";
import { ArrowRight } from "lucide-react";
import { designs } from "./data/designs.js";

export default function DesignGallery({ goShop, onStory, full = false }) {
  const featured = [32, 33, 26, 27, 28, 29, 30, 31].map((id) =>
    designs.find((design) => design.id === id),
  );
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
        {(full ? designs : featured).map((design) => (
          <figure key={design.id}>
            <img
              src={design.src}
              alt={`Hand embroidery: ${design.name}`}
              loading="lazy"
              decoding="async"
            />
            <figcaption>{design.name}</figcaption>
          </figure>
        ))}
      </div>
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
