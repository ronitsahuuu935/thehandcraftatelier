"""Generate smaller storefront images without changing the original product photos.

Run with Python and Pillow installed. Existing verified remote aliases are kept
only while their local source and generated URLs remain unchanged.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

root = Path(__file__).resolve().parents[1]
media = root / "public/media"
output = media / "responsive"
output.mkdir(exist_ok=True)
manifest_path = root / "src/data/responsive-images.json"
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
manifest = {}
for folder in ("images", "products"):
    for source in (media / folder).glob("*.webp"):
        with Image.open(source) as image:
            digest = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
            variants = []
            for width in (400, 800):
                if image.width <= width:
                    continue
                thumbnail = image.copy()
                thumbnail.thumbnail((width, 10000))
                name = f"{source.stem}-{digest}-{width}.webp"
                if not (output / name).exists():
                    thumbnail.save(output / name, "WEBP", quality=76, method=6)
                variants.append(f"/media/responsive/{name} {thumbnail.width}w")
            if variants:
                url = f"/media/{folder}/{source.name}"
                manifest[url] = {
                    "srcSet": ", ".join(variants + [f"{url} {image.width}w"]),
                    "width": image.width,
                    "height": image.height,
                }
valid_sets = {entry["srcSet"] for entry in manifest.values()}
for url, entry in previous.items():
    if url.startswith("https://") and entry["srcSet"] in valid_sets:
        manifest[url] = entry
with Image.open(media / "images/logo.webp") as logo:
    logo.thumbnail((64, 64))
    logo.save(output / "favicon.webp", "WEBP", quality=80)
manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
print(f"Prepared {len(manifest)} image sources and aliases.")
