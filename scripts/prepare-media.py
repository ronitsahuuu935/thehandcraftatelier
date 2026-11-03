"""Import a fresh asset batch from an external folder into public/media.

The source directory should contain images/ and products/ subdirectories.
Existing display assets and legacy URL mappings are retained.
"""
from pathlib import Path
from PIL import Image, ImageOps
import argparse
import json
import shutil

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, required=True, help='Original asset batch directory')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
source_root = args.source.resolve()
media_root = (root / 'public' / 'media').resolve()
if source_root == media_root or media_root in source_root.parents:
    parser.error('Use original source files outside public/media to avoid recompressing display images.')
manifest_path = root / 'src' / 'data' / 'media.json'
manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
processed = 0
for folder in ('images', 'products'):
    source_folder = source_root / folder
    if not source_folder.is_dir():
        continue
    for source in sorted(source_folder.iterdir()):
        suffix = source.suffix.lower()
        if suffix not in ('.png', '.jpg', '.jpeg', '.webp', '.mp4'):
            continue
        filename = source.name if suffix == '.mp4' else source.stem + '.webp'
        destination = media_root / folder / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        entry = {'src': f'/media/{folder}/{filename}'}
        if suffix == '.mp4':
            shutil.copy2(source, destination)
        else:
            image = ImageOps.exif_transpose(Image.open(source))
            image.thumbnail((1400, 1400))
            image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
            image.save(destination, 'WEBP', quality=84, method=6)
            entry.update(width=image.width, height=image.height)
        manifest[f'/{folder}/{source.name}'] = entry
        processed += 1
if not processed:
    parser.error('No supported assets found in the source images/ or products/ subdirectories.')
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Prepared {processed} assets in public/media; existing URL mappings retained.')
