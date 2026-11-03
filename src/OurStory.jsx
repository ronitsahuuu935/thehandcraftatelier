import React from "react";
import { ArrowRight, HeartHandshake, Sprout, Landmark, Heart } from "lucide-react";
import DesignGallery from "./DesignGallery";
import { imageUrl } from "./data/media.js";

export default function OurStory({ goShop }) {
  return (
    <main className="our-story">
      <div className="story-kicker">EMBROIDERY · ART · A MORE MEANINGFUL HOME</div>
      <section className="story-hero">
        <div className="story-intro">
          <span className="eyebrow">
            OUR STORY <i />
          </span>
          <h1>Our Story</h1>
          <p className="story-lead">
            A small dream, a needle, and
            <br />a deep love for handmade things.
          </p>
          <p>
            Started by a 21-year-old young boy with a passion for hand embroidery and thoughtful
            craftsmanship.
          </p>
          <p>
            Every embroidery is carefully made by hand with close attention to detail and finishing.
          </p>
          <p>
            <strong>Completely Made in India.</strong>
          </p>
          <button className="story-collection-button" onClick={() => goShop()}>
            Our collections <ArrowRight size={18} />
          </button>
        </div>
        <div className="story-hero-art">
          <img
            src="/images/logo.webp"
            alt="Hand-embroidered woodland bunny surrounded by flowers, mushrooms and a red butterfly"
            fetchPriority="high"
          />
        </div>
      </section>
      <section className="story-values" aria-label="Our craft values">
        {[
          {
            Icon: HeartHandshake,
            title: "Handmade",
            copy: "Each piece is made by hand with love and patience.",
          },
          {
            Icon: Sprout,
            title: "Artisan Crafted",
            copy: "Thoughtful craftsmanship in every detail.",
          },
          { Icon: Landmark, title: "Made in India", copy: "Proudly and completely made in India." },
        ].map(({ Icon, title, copy }) => (
          <div key={title}>
            <span>
              <Icon size={36} strokeWidth={1.2} />
            </span>
            <h2>{title}</h2>
            <p>{copy}</p>
          </div>
        ))}
      </section>
      <section className="story-journey">
        <figure className="story-photo">
          <img
            src={imageUrl("/images/d1-wreath.webp")}
            alt="A floral embroidery hoop with red blooms and green leaves, resting on soft fabric beside flowers and threads"
            loading="lazy"
          />
        </figure>
        <div className="story-journey-copy">
          <span className="eyebrow">
            OUR JOURNEY <i />
          </span>
          <h2>
            Crafting a Kinder,
            <br />
            More Beautiful Everyday
          </h2>
          <p>
            The Hand Craft Atelier began with a simple love for hand embroidery and the joy it
            brings to everyday life. What started as a small dream has grown into a mindful brand
            that celebrates slow craft, timeless designs, and the beauty of handmade living.
          </p>
          <p>
            Each piece is made with love, patience and artistry, using fine materials and careful
            attention to detail. We believe in the beauty of things made slowly, and in the stories
            that handmade pieces carry into your home.
          </p>
          <span className="story-handwritten">
            Small stitches, brighter days <Heart size={20} />
          </span>
        </div>
      </section>
      <section className="story-maker">
        <div className="story-maker-portrait">
          <img
            src={imageUrl("/images/ronit.webp")}
            alt="Ronit, the person behind The Hand Craft Atelier"
            loading="lazy"
          />
        </div>
        <div>
          <span className="eyebrow">THE PERSON BEHIND THE THREAD</span>
          <h2>
            A small atelier.
            <br />A very personal story.
          </h2>
          <p>
            Hi, I’m Ronit. The Hand Craft Atelier started with a love for hand embroidery and the
            little details that make a piece feel personal.
          </p>
          <p>
            From choosing a motif to finishing the last stitch, this is a space for patience,
            colour, and things made with care. Thank you for being part of the journey.
          </p>
          <span className="story-handwritten">Made by hand, shared with love.</span>
        </div>
      </section>
      <section className="story-process">
        <div className="story-process-heading">
          <span className="eyebrow">A MOMENT IN THE MAKING</span>
          <h2>Watch the little details come to life.</h2>
          <p>A closer look at the embroidery that gives each piece its character.</p>
        </div>
        <div className="story-process-grid">
          <video
            controls
            playsInline
            preload="none"
            poster={imageUrl("/images/d6-960.webp")}
            aria-label="Blue embroidery reel"
          >
            <source src="/images/blue_embro_reel.mp4" type="video/mp4" />
            Your browser does not support video playback.
          </video>
          <figure>
            <img
              src={imageUrl("/images/d6-960.webp")}
              alt="Tiny embroidered birds and flowers on blue fabric"
              loading="lazy"
            />
            <figcaption>A little colour, a little joy.</figcaption>
          </figure>
          <figure>
            <img
              src={imageUrl("/images/d9-960.webp")}
              alt="Hand embroidery of a hand holding a floral bouquet on peach fabric"
              loading="lazy"
            />
            <figcaption>Flowers that stay with you.</figcaption>
          </figure>
        </div>
      </section>
      <DesignGallery goShop={goShop} full />
      <section className="story-wear">
        <figure>
          <img
            src={imageUrl("/images/model.webp")}
            alt="Handcrafted clothing styled for everyday wear"
            loading="lazy"
          />
        </figure>
        <div>
          <span className="eyebrow">FROM THE HOOP TO YOUR EVERYDAY</span>
          <h2>
            Art you can
            <br />
            make your own.
          </h2>
          <p>
            A favourite shirt, a thoughtful gift, a tiny flower in your hair. Our embroidery finds
            its way into the everyday things you keep close.
          </p>
          <img
            className="story-wear-detail"
            src={imageUrl("/images/Floral_Embroidery_Hoop.webp")}
            alt="A colourful floral embroidery hoop"
            loading="lazy"
          />
          <button className="story-collection-button" onClick={() => goShop()}>
            Find your piece <ArrowRight size={18} />
          </button>
        </div>
      </section>
      <section className="story-closing">
        <blockquote>
          “Hand embroidery is not just what we create,
          <br />
          but a way of seeing a slower, kinder and more beautiful world.”
        </blockquote>
        <span aria-hidden="true">— ♥ —</span>
      </section>
    </main>
  );
}
