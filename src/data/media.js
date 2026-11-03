import media from "./media.json";

export const imageUrl = (source) => media[source]?.src || source;
// Resolve saved legacy paths without requiring the original public folders.
export const resolveGalleryMedia = (item) => ({
  ...item,
  src: imageUrl(item.src),
  ...(item.poster ? { poster: imageUrl(item.poster) } : {}),
});
export const isVideo = (item) => item?.type === "video" || /\.mp4(?:\?|$)/i.test(item?.src || "");
