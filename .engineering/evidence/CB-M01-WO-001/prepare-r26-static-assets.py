"""Create reproducible, optimized PNG and WebP previews from R26 ImageGen masters."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import PIL
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[3]
ASSET_ROOT = ROOT / "src/modules/CB-M01/assets/r26"
OUTPUT_PATH = ROOT / ".engineering/evidence/CB-M01-WO-001/r26-static-asset-derivatives.json"
ASSETS = {
    "promo": ("masters/promo.png", (1200, 1200)),
    "bitcoin": ("masters/bitcoin.png", (768, 512)),
    "ethereum": ("masters/ethereum.png", (768, 512)),
    "policy": ("masters/policy.png", (768, 512)),
    "ecosystem": ("masters/ecosystem.png", (768, 512)),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_record(path: Path) -> dict[str, object]:
    with Image.open(path) as image:
        image.load()
        return {
            "path": path.relative_to(ROOT).as_posix(),
            "width": image.width,
            "height": image.height,
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
            "format": image.format,
        }


def main() -> None:
    records: dict[str, dict[str, object]] = {}
    for name, (master_relative, bounds) in ASSETS.items():
        master_path = ASSET_ROOT / master_relative
        with Image.open(master_path) as opened:
            opened.load()
            if opened.format != "PNG":
                raise ValueError(f"{master_path} is not a PNG ImageGen source master")
            source = ImageOps.exif_transpose(opened).convert("RGB")
            source.thumbnail(bounds, Image.Resampling.LANCZOS, reducing_gap=3.0)
            preview_png = ASSET_ROOT / f"{name}.png"
            preview_webp = ASSET_ROOT / f"{name}.webp"
            source.save(preview_png, format="PNG", optimize=True, compress_level=9)
            source.save(preview_webp, format="WEBP", quality=88, method=6)
        records[name] = {
            "master": image_record(master_path),
            "png": image_record(preview_png),
            "webp": image_record(preview_webp),
            "derivativeRelation": "RESIZED_OR_REENCODED_FROM_EXACT_IMAGEGEN_MASTER",
        }
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "schemaVersion": 1,
                "derivation": {
                    "script": ".engineering/evidence/CB-M01-WO-001/prepare-r26-static-assets.py",
                    "pythonVersion": sys.version.split()[0],
                    "pillowVersion": PIL.__version__,
                    "resampler": "LANCZOS",
                    "png": "RGB PNG optimize=True compress_level=9",
                    "webp": "RGB WebP quality=88 method=6",
                    "promoBounds": [1200, 1200],
                    "editorialBounds": [768, 512],
                    "resizeMode": "CONTAIN_WITHOUT_CROP",
                },
                "assets": records,
            },
            indent=2,
            ensure_ascii=False,
        ) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(json.dumps({name: record["webp"] for name, record in records.items()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
