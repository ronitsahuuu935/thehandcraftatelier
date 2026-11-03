import React from "react";

import { ArrowRight } from "lucide-react";

import { IMG } from "../data/storefront.js";

export function GoogleSignInScreen({ onGoogleSignIn }) {
  return (
    <section className="google-signin-page">
      <img
        className="google-flower google-flower-one"
        src={IMG + "Floral_Embroidery_Hoop.webp"}
        alt=""
        aria-hidden="true"
      />
      <img
        className="google-flower google-flower-two"
        src={IMG + "design-32.webp"}
        alt=""
        aria-hidden="true"
      />
      <img
        className="google-flower google-flower-three"
        src={IMG + "logo.webp"}
        alt=""
        aria-hidden="true"
      />
      <section className="google-signin-card">
        <div className="google-signin-mark">⌁</div>
        <h2>Welcome back</h2>
        <p>
          Sign in to continue to your account and
          <br />
          keep track of your orders, favourites and more.
        </p>
        <button className="google-signin-button" type="button" onClick={onGoogleSignIn}>
          <img src={IMG + "G_logo.webp"} alt="" aria-hidden="true" />
          <span>Continue with Google</span>
          <ArrowRight size={19} />
        </button>
      </section>
    </section>
  );
}
