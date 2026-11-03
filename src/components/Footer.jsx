import React, { useState } from "react";

import { SOCIAL, images } from "../data/storefront.js";

export function Footer({ goShop, navigate }) {
  const [phone, setPhone] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer>
      <section className="newsletter">
        <div className="flower-mark">✿</div>
        <div className="newsletter-copy">
          <h2>A little joy, delivered.</h2>
          <p>
            Letters from the atelier, new blooms & a little something special. Enjoy 10% off your
            first order.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (phone.replace(/\D/g, "").length >= 10) setSubscribed(true);
          }}
          className="newsletter-form"
        >
          <div>
            <input
              type="tel"
              inputMode="tel"
              required
              pattern="[+]?[0-9 ()-]{10,15}"
              autoComplete="tel"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button>{subscribed ? "JOINED ✓" : "JOIN US"}</button>
          </div>
          <small>
            {subscribed
              ? "Welcome to our atelier."
              : "Only thoughtful messages. Reply STOP whenever you like."}
          </small>
        </form>
      </section>
      <section className="footer-main">
        <div className="footer-brand">
          <h3>The Hand Craft Atelier</h3>
          <p className="tagline">Handmade · Heartfelt · Forever</p>
          <p>
            Thoughtful keepsakes, stitched slowly. For the little moments and the people who mean
            everything.
          </p>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <a
            href="#our-story"
            onClick={(e) => {
              e.preventDefault();
              navigate("story");
            }}
          >
            Our Story
          </a>
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              goShop();
            }}
          >
            Shop all
          </a>
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              goShop("Shirts");
            }}
          >
            Shirts
          </a>
          <a
            href="#shop"
            onClick={(e) => {
              e.preventDefault();
              goShop();
            }}
          >
            Personalized
          </a>
        </div>
        <div>
          <h4>HERE TO HELP</h4>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              navigate("contact");
            }}
          >
            Contact us
          </a>
          <a href="/policies/shipping.html" target="_blank" rel="noopener noreferrer">
            Shipping policy
          </a>
          <a href="/policies/refund.html" target="_blank" rel="noopener noreferrer">
            Refund policy
          </a>
          <a href="/policies/terms.html" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>
          <a href="/policies/privacy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </div>
      </section>
      <div className="mobile-social-links">
        <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer">
          <img src={images.instagram} alt="" />
          Instagram
        </a>
        <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer">
          <img src={images.whatsapp} alt="" />
          WhatsApp
        </a>
      </div>
      <div className="legal">
        <span>© 2026 The Hand Craft Atelier. All lovingly reserved.</span>
      </div>
    </footer>
  );
}
