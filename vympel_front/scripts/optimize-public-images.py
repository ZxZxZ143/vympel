"""Convert the audited oversized public rasters to dimension-preserving WebP files.

Requires Pillow 11+ and changes only the explicit Step 8 target allowlist below.
Run without --apply for a size preview; run with --apply to write WebP outputs and
remove the superseded source files after each output has decoded successfully.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from PIL import Image

TARGETS = (
    "PIERRE_RICAUD_brand_banner.jpg",
    "Romanson_brand_banner.png",
    "shop.png",
    "romanson.png",
    "contact-banner-catalog.png",
    "accessories_hero_banner.png",
    "Royal_london_brand_banner.png",
    "caseBanner.png",
    "newsBanner.png",
    "product-hero-banner.png",
    "catalog-hero-banner.png",
    "pierre-ricaud.png",
    "braceletBanner.png",
    "Romanson_banner.png",
    "philosophy_1.png",
    "rhythm.png",
    "adriatica.png",
    "interior_hero_banner.png",
    "appella.png",
    "about-us-banner.png",
    "insta-3.png",
    "insta-4.png",
    "insta-1.png",
    "category_3.png",
    "Rhythm_brand_banner.jpg",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--quality", type=int, default=84)
    args = parser.parse_args()
    public_dir = Path(__file__).resolve().parents[1] / "public"
    before = 0
    after = 0

    for name in TARGETS:
        source = public_dir / name
        target = source.with_suffix(".webp")
        if not source.exists():
            if target.exists():
                print(f"already optimized: {target.name}")
                continue
            raise FileNotFoundError(source)
        source_size = source.stat().st_size
        before += source_size
        with Image.open(source) as image:
            original_size = image.size
            image.save(target, "WEBP", quality=args.quality, method=6, exact=True)
        with Image.open(target) as optimized:
            optimized.load()
            if optimized.size != original_size:
                target.unlink(missing_ok=True)
                raise RuntimeError(f"dimension mismatch for {name}")
        target_size = target.stat().st_size
        after += target_size
        print(f"{name}: {source_size / 1_048_576:.2f} MB -> {target_size / 1_048_576:.2f} MB")
        if args.apply:
            source.unlink()
        else:
            target.unlink()

    print(f"targets: {before / 1_048_576:.2f} MB -> {after / 1_048_576:.2f} MB")


if __name__ == "__main__":
    main()
