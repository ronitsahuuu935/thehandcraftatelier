import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = fileURLToPath(new URL("../", import.meta.url));
process.loadEnvFile(path.join(root, ".env"));
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const bucket =
  process.env.SUPABASE_STORAGE_BUCKET ||
  process.env.VITE_SUPABASE_STORAGE_BUCKET ||
  "product-images";
const catalog = JSON.parse(await fs.readFile(path.join(root, "src/data/products.json"), "utf8"));
const media = JSON.parse(await fs.readFile(path.join(root, "src/data/media.json"), "utf8"));
const { data: existing, error: readError } = await client.from("products").select("id,image_url");
if (readError) throw new Error(readError.message);
const existingIds = new Set(existing.map((product) => Number(product.id)));
const incoming = catalog.filter((product) => !existingIds.has(product.id));
const urls = new Map();
async function upload(source) {
  const local = media[source]?.src || source;
  if (urls.has(local)) return urls.get(local);
  const filename = path.basename(local);
  const remotePath = `catalog/november-2026/${filename}`;
  const { error } = await client.storage
    .from(bucket)
    .upload(remotePath, await fs.readFile(path.join(root, "public", local)), {
      contentType: local.endsWith(".mp4") ? "video/mp4" : "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });
  if (error && error.message !== "The resource already exists" && error.statusCode !== "409") {
    throw new Error(`Upload failed for ${filename}: ${error.message}`);
  }
  const url = client.storage.from(bucket).getPublicUrl(remotePath).data.publicUrl;
  urls.set(local, url);
  return url;
}
for (const product of incoming) {
  const { imageSource, gallery, ...values } = product;
  const image_url = await upload(imageSource);
  const uploadedGallery = [];
  for (const { source, posterSource, ...item } of gallery) {
    uploadedGallery.push({
      ...item,
      src: await upload(source),
      ...(posterSource ? { poster: await upload(posterSource) } : {}),
    });
  }
  const { error } = await client
    .from("products")
    .insert({ ...values, image_url, gallery: uploadedGallery, is_active: true });
  if (error) throw new Error(`Import failed for product ${product.id}: ${error.message}`);
  console.log(`Imported ${product.id}: ${product.name}`);
}
// Retire only the known built-in records whose image paths were removed from the repository.
// Keep their rows intact so historical orders and reviews continue to reference the same IDs.
const oldIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14];
for (const old of existing.filter(
  (product) =>
    oldIds.includes(Number(product.id)) && /^\/products\/p\d+\.webp$/.test(product.image_url || ""),
)) {
  const { error } = await client
    .from("products")
    .update({ is_active: false })
    .eq("id", old.id)
    .eq("image_url", old.image_url);
  if (error) throw new Error(`Could not retire product ${old.id}: ${error.message}`);
}
const { data: active, error } = await client
  .from("products")
  .select("id,name,price,sizes")
  .eq("is_active", true)
  .order("id");
if (error) throw new Error(error.message);
console.log(
  JSON.stringify({
    imported: incoming.length,
    uploadedMedia: urls.size,
    activeProducts: active.length,
    ids: active.map((product) => product.id),
  }),
);
