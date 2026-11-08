"""Lossless runtime packaging. PNG sources remain untouched."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/art/monsters'
old=new=0
for source in sorted(root.glob('*.png')):
 image=Image.open(source).convert('RGBA');target=source.with_suffix('.webp');image.save(target,'WEBP',lossless=True,method=5,exact=True)
 decoded=Image.open(target).convert('RGBA')
 assert image.size==decoded.size
 assert image.tobytes()==decoded.tobytes(),source.name
 old+=source.stat().st_size;new+=target.stat().st_size
 print(f'{source.name}: {source.stat().st_size} -> {target.stat().st_size}',flush=True)
print(f'LOSSLESS {old} -> {new} bytes',flush=True)
