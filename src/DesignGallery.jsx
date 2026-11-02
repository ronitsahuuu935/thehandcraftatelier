import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

const names = ["Little black bird", "Palm tree", "Woodland bear", "Little fox", "Floral garland", "Woodland squirrel", "Garden crane", "Moonlit branches", "Little garden", "Butterfly and bloom", "Little elephant", "Woodland deer", "Pink blossom stem", "Rose bouquet", "Golden feather", "Little blue bird", "Bird in flight", "Fern leaf", "Rose sprig", "Botanical stem", "Bird on a branch", "Autumn leaf", "Peacock garden", "Delicate wildflowers", "Floral initial", "Butterfly in blue", "Woodland butterfly", "Little sheep", "Desert camel", "Little giraffe", "Horse portrait", "Sailing ship", "Wildflower study", "Petals in detail", "Sunflower stem"];
const order = [...Array.from({length: 10}, (_, i) => i + 26), ...Array.from({length: 25}, (_, i) => i + 1)];

export default function DesignGallery({ goShop }) {
  const [expanded, setExpanded] = useState(false);
  return <section className="section-wrap embroidery-gallery">
    <div className="section-heading"><div><span className="eyebrow">A CLOSER LOOK AT OUR CRAFT</span><h2>Little stitches. Endless stories.</h2><p>Explore our embroidery, from woodland creatures to delicate blooms.</p></div></div>
    <div className="embroidery-gallery-grid">{(expanded ? order : order.slice(0, 8)).map(id => <figure key={id}><img src={`/images/design-${id}.webp`} alt={`Hand embroidery: ${names[id - 1]}`} loading="lazy"/><figcaption>{names[id - 1]}</figcaption></figure>)}</div>
    <div className="embroidery-gallery-actions"><button className="text-link" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show fewer designs" : "Explore all 35 designs"}</button><button className="text-link" onClick={() => goShop("Personalized")}>Shop personalized pieces <ArrowRight size={15}/></button></div>
  </section>;
}
