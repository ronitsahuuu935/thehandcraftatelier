import media from "./media.json";

export const imageUrl = (source) => media[source]?.src || source;
export const isVideo = (item) => item?.type === "video" || /\.mp4(?:\?|$)/i.test(item?.src || "");
