"""Lossless encoding only; the PNG raster illustration and masks are unchanged."""
from pathlib import Path
from PIL import Image
before=after=0
for source in sorted((Path(__file__).resolve().parents[1]/'public/art/characters').glob('*.png')):
    image=Image.open(source).convert('RGBA');target=source.with_suffix('.webp')
    image.save(target,'WEBP',lossless=True,method=6,exact=True)
    assert Image.open(target).convert('RGBA').tobytes()==image.tobytes(),source.name
    before+=source.stat().st_size;after+=target.stat().st_size
print(f'LOSSLESS character atlases {before} -> {after} bytes; all RGBA pixels identical')
