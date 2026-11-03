import catalog from "./products.json";
import { imageUrl } from "./media.js";

// These IDs are separate from the retired catalog, preserving historical order references.
export const products = catalog.map(({ imageSource, gallery, ...product }) => ({
  ...product,
  image: imageUrl(imageSource),
  gallery: gallery.map(({ source, posterSource, ...item }) => ({
    ...item,
    src: imageUrl(source),
    ...(posterSource ? { poster: imageUrl(posterSource) } : {}),
  })),
}));
