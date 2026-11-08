"""Normalize the generated tower's alpha matte for a crisp game sprite (preserve painted RGB)."""
from pathlib import Path
from PIL import Image
source=Path('docs/art/root-seal-tower-source.png')
im=Image.open(source).convert('RGBA')
# The generated export has a low-opacity ambient halo; opaque architecture is alpha 250–254.
im.putalpha(im.getchannel('A').point(lambda a:max(0,min(255,round((a-232)*255/18)))))
bounds=im.getbbox()
if not bounds: raise ValueError('Empty tower sprite')
im=im.crop((max(0,bounds[0]-8),max(0,bounds[1]-8),min(im.width,bounds[2]+8),min(im.height,bounds[3]+8)))
im.save('public/art/world/root-seal-tower.png')
im.save('public/art/world/root-seal-tower.webp',lossless=True)
print('Normalized tower:',im.size)
