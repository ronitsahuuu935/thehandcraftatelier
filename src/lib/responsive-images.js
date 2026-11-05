import images from "../data/responsive-images.json";

export function responsiveImageProps(source, sizes = "(max-width: 620px) 46vw, 25vw") {
  const image = images[source];
  return image ? { srcSet: image.srcSet, sizes } : {};
}
