from pathlib import Path
from PIL import Image, ImageOps
import json

root = Path(__file__).resolve().parents[1]
manifest = {}
for folder in ('images', 'products'):
    for source in sorted((root / 'public' / folder).iterdir()):
        if source.suffix.lower() not in ('.png', '.jpg', '.jpeg', '.webp'):
            continue
        image = ImageOps.exif_transpose(Image.open(source))
        image.thumbnail((1400, 1400))
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        destination = root / 'public' / 'media' / folder / (source.stem + '.webp')
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, 'WEBP', quality=84, method=6)
        manifest['/' + str(source.relative_to(root / 'public')).replace('\\', '/')] = {
            'src': '/' + str(destination.relative_to(root / 'public')).replace('\\', '/'),
            'width': image.width, 'height': image.height
        }
(root / 'src' / 'data' / 'media.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Prepared {len(manifest)} display images.')
