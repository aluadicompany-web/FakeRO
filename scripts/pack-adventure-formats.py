"""Lossless runtime packaging for equipment, guide and root details."""
from pathlib import Path
from PIL import Image
base=Path(__file__).resolve().parents[1]/'public/art'
files=list((base/'weapons').glob('*.png'))+list((base/'npcs').glob('*.png'))+[base/'world/root-details.png']
for source in files:
    image=Image.open(source).convert('RGBA');target=source.with_suffix('.webp')
    image.save(target,'WEBP',lossless=True,method=6,exact=True)
    assert Image.open(target).convert('RGBA').tobytes()==image.tobytes(),source.name
print(f'Packed {len(files)} sheets with pixel-identical RGBA')
