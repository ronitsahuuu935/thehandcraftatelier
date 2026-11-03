import React from "react";

import { SOCIAL, images } from "../data/storefront.js";

export function FloatingSocials() {
  return (
    <>
      <a
        className="float-social left"
        href={SOCIAL.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <img src={images.instagram} alt="" width="34" height="34" />
      </a>
      <a
        className="float-social right"
        href={SOCIAL.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
      >
        <img src={images.whatsapp} alt="" width="34" height="34" />
      </a>
    </>
  );
}
