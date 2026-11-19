#!/usr/bin/env python3
"""Turn raw generated art into game-ready files.

Drop images into art/raw/ (any of png, jpg, jpeg, webp), named as docs/FLOW.md says, then run:

    python3 tools/art.py

It crops, resizes, removes the plain background from icons, writes the results into assets/,
and rewrites assets/manifest.json, which is how the game knows what art exists.
Anything not supplied keeps its built-in placeholder.
"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
RAW, OUT = ROOT / 'art' / 'raw', ROOT / 'assets'
EXT = {'.png', '.jpg', '.jpeg', '.webp'}

# Banners whose subject is not in the middle: 0 keeps the top of the image, 1 the bottom.
BANNER_BIAS = {'1900': 0.95, '1855': 0.3, '1893': 0.62}


def crop_to(img, ratio, top_bias=0.5):
    """Center-crop to width/height = ratio. top_bias 0 keeps the top, 1 the bottom."""
    w, h = img.size
    if w / h > ratio:
        nw = round(h * ratio); x = (w - nw) // 2; return img.crop((x, 0, x + nw, h))
    nh = round(w / ratio); y = round((h - nh) * top_bias); return img.crop((0, y, w, y + nh))

def cut_background(img, tol=34):
    """Make the plain background transparent by flood-filling in from the four corners."""
    img = img.convert('RGBA'); w, h = img.size
    marker = (255, 0, 255, 0)
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        if img.getpixel(xy) != marker: ImageDraw.floodfill(img, xy, marker, thresh=tol)
    return img

def trim(img, pad=0.06):
    box = img.getbbox()
    if not box: return img
    img = img.crop(box); w, h = img.size; side = round(max(w, h) * (1 + pad * 2))
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(img, ((side - w) // 2, (side - h) // 2), img); return sq

def files(kind):
    d = RAW / kind
    return sorted(p for p in d.iterdir() if p.suffix.lower() in EXT) if d.exists() else []

def main():
    man = {'portraits': [], 'icons': [], 'rounds': [], 'ui': [], 'landmarks': []}
    for p in files('portraits'):     # 3:4 waist-up figure; a taller image keeps its top so the head is never cut
        im = crop_to(Image.open(p).convert('RGB'), 3 / 4, top_bias=0.05).resize((540, 720), Image.LANCZOS)
        im.save(OUT / 'portraits' / f'{p.stem.lower()}.jpg', quality=88); man['portraits'].append(p.stem.lower())
    for p in files('icons'):         # square, background removed
        im = trim(cut_background(Image.open(p))).resize((160, 160), Image.LANCZOS)
        im.save(OUT / 'icons' / f'{p.stem.lower()}.png'); man['icons'].append(p.stem.lower())
    for p in files('rounds'):        # wide banner across the top of a history card
        im = crop_to(Image.open(p).convert('RGB'), 3.2, BANNER_BIAS.get(p.stem.lower(), 0.5)).resize((1120, 350), Image.LANCZOS)
        im.save(OUT / 'rounds' / f'{p.stem.lower()}.jpg', quality=85); man['rounds'].append(p.stem.lower())
    for p in files('landmarks'):     # hero shot across the top of a landmark card
        im = crop_to(Image.open(p).convert('RGB'), 16 / 9).resize((1120, 630), Image.LANCZOS)
        im.save(OUT / 'landmarks' / f'{p.stem.lower()}.jpg', quality=86); man['landmarks'].append(p.stem.lower())
    for p in files('ui'):            # title art and anything else: just made a sensible size
        im = Image.open(p).convert('RGB'); im.thumbnail((1600, 1600), Image.LANCZOS)
        im.save(OUT / 'ui' / f'{p.stem.lower()}.jpg', quality=86); man['ui'].append(p.stem.lower())
    (OUT / 'manifest.json').write_text(json.dumps(man, indent=1) + '\n')
    for k, v in man.items(): print(f'{k}: {len(v)}', ', '.join(v))

if __name__ == '__main__':
    sys.exit(main())
