import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Audit by default; --apply only appends missing media to existing active products.
process.loadEnvFile(".env");
const apply = process.argv.includes("--apply");
const client = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const bucket =
  process.env.SUPABASE_STORAGE_BUCKET ||
  process.env.VITE_SUPABASE_STORAGE_BUCKET ||
  "product-images";
const catalog = JSON.parse(await fs.readFile("src/data/products.json", "utf8"));
const filename = (url) =>
  path
    .basename(new URL(url, "https://local.invalid").pathname)
    .replace(/-[a-f0-9]{12}(?=\.[^.]+$)/, "");
const { data: rows, error } = await client
  .from("products")
  .select("id,name,image_url,gallery")
  .eq("is_active", true);
if (error) throw new Error(error.message);
let missing = 0;
for (const product of catalog) {
  const row = rows.find((item) => Number(item.id) === product.id);
  if (!row) {
    console.log(`Skipped inactive or absent product ${product.id}: ${product.name}`);
    continue;
  }
  const gallery = [...(row.gallery || [])];
  const present = new Set(
    [row.image_url, ...gallery.map((item) => item.src)].filter(Boolean).map(filename),
  );
  const additions = product.gallery.filter((item) => !present.has(filename(item.source)));
  if (!additions.length) continue;
  missing += additions.length;
  console.log(
    `${row.id} ${row.name}: ${additions.map((item) => filename(item.source)).join(", ")}`,
  );
  if (!apply) continue;
  // Include the existing cover in the detail gallery if it was previously absent.
  if (!gallery.some((item) => item.src === row.image_url)) gallery.unshift({ src: row.image_url });
  for (const { source, posterSource, ...metadata } of additions) {
    const bytes = await fs.readFile(path.join("public", source));
    const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 12);
    const ext = path.extname(source);
    const key = `catalog/november-2026/${path.basename(source, ext)}-${hash}${ext}`;
    const { error: uploadError } = await client.storage.from(bucket).upload(key, bytes, {
      contentType: ext === ".mp4" ? "video/mp4" : "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
    if (
      uploadError &&
      String(uploadError.statusCode) !== "409" &&
      uploadError.message !== "The resource already exists"
    )
      throw new Error(uploadError.message);
    const src = client.storage.from(bucket).getPublicUrl(key).data.publicUrl;
    const response = await fetch(src, { method: "HEAD" });
    if (!response.ok) throw new Error(`Uploaded media unavailable: ${key}`);
    const poster = posterSource
      ? [row.image_url, ...gallery.map((item) => item.src)].find(
          (url) => url && filename(url) === filename(posterSource),
        ) || posterSource
      : undefined;
    gallery.push({ ...metadata, src, ...(poster ? { poster } : {}) });
  }
  const { data: saved, error: saveError } = await client
    .from("products")
    .update({ gallery })
    .eq("id", row.id)
    .eq("is_active", true)
    .eq("gallery", JSON.stringify(row.gallery))
    .select("id")
    .single();
  if (saveError || !saved)
    throw new Error(
      `Gallery changed during sync or save failed for ${row.id}: ${saveError?.message}`,
    );
}
console.log(
  JSON.stringify({ activeProducts: rows.length, [apply ? "addedMedia" : "missingMedia"]: missing }),
);
