"""Build the R26 image provenance manifest from verified local derivative inventory."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
EVIDENCE_ROOT = ROOT / ".engineering/evidence/CB-M01-WO-001"
DERIVATIVES = EVIDENCE_ROOT / "r26-static-asset-derivatives.json"
OUTPUT = EVIDENCE_ROOT / "r26-static-asset-provenance.json"
PROMPTS = {
    "promo": {
        "assetId": "CB-M01-R26-PROMO-MASTER",
        "region": "promo",
        "generatedOutputName": "exec-1a8d510e-ea15-4936-a5c7-34000075ca5b.png",
        "prompt": "Create one original, static widescreen promotional banner illustration for a dark premium crypto research demo website. Aspect ratio 2:1. Cinematic near-black basalt mountains at dusk, subtle atmospheric haze, luminous acid-lime aurora and a large abstract eclipse/planet concentrated on the RIGHT half, with restrained golden reflections and a tiny anonymous human silhouette standing on a ridge near the right third for scale. Keep the LEFT 45 percent very dark, low-detail, clean negative space so live HTML headline text can sit over it. Rich detailed painterly realism, restrained premium editorial art direction, realistic light and layered depth, composition readable when cropped to 360x180. No lettering, no numerals, no typography, no logos, no coins, no watermarks, no charts, no market data, no recognizable person, no use of or crop from any existing CoinBlink or Golden reference image. This is a decorative DEMO art master only; generate the image itself, not a mockup or webpage.",
    },
    "bitcoin": {
        "assetId": "CB-M01-R26-EDITORIAL-BITCOIN",
        "region": "editorial-bitcoin",
        "generatedOutputName": "exec-91ee0057-a372-437e-afbd-468548f0d3b3.png",
        "prompt": "Create one original static editorial thumbnail illustration for a premium dark crypto research DEMO site, landscape 3:2 composition, crop-safe at both 1.5:1 and square. A single substantial sculptural gold/brushed-brass coin standing at a slight angle on fractured charcoal basalt, illuminated by a restrained warm amber key light with subtle lime-green rim light, shallow atmospheric depth and elegant metallic detail. The coin face is completely blank with only abstract concentric engraved rings, no emblem, no letter, no currency mark, no recognizable Bitcoin symbol. Dark near-black forest-green background, crisp subject silhouette, premium photorealistic editorial art direction, high contrast and readable at 80x54 pixels. No text, no numbers, no charts, no logos, no watermark, no people, no third-party source, no crop from existing CoinBlink or Golden images. Decorative fictional DEMO art, not a factual news photograph; generate only the image.",
    },
    "ethereum": {
        "assetId": "CB-M01-R26-EDITORIAL-ETHEREUM",
        "region": "editorial-ethereum",
        "generatedOutputName": "exec-5b83bae2-e2f7-4ba6-8793-ff89b01e6626.png",
        "prompt": "Create an original static editorial thumbnail for a premium dark crypto research DEMO site, landscape 3:2, crop-safe at 1.5:1 and square. A sculptural interwoven bridge of thin silver-blue glass and brushed titanium arcs crossing a deep alpine gorge at twilight, tiny cyan and violet light glints traveling along the structure, cold slate mountains and low mist behind it. The structure is asymmetrical curved engineering with open negative spaces, clearly a bridge/technical network, NOT a crystal, gem, rhombus, diamond, pointed lozenge, Ethereum logo, or other brand mark. Dark midnight blue-green background, crisp high-contrast silhouette, restrained lime rim light, premium realistic editorial art direction, readable at 80x54 pixels. No text, letters, numbers, symbols, charts, logos, watermarks, people, flags, third-party source, or crop from existing CoinBlink or Golden images. Fictional decorative DEMO art, not a factual news photograph; generate only the image.",
    },
    "policy": {
        "assetId": "CB-M01-R26-EDITORIAL-POLICY",
        "region": "editorial-policy",
        "generatedOutputName": "exec-c06f85cf-1fc9-40ef-a747-6e8be6c1db1f.png",
        "prompt": "Create one original static editorial thumbnail illustration for a premium dark crypto research DEMO site, landscape 3:2, crop-safe at 1.5:1 and square. A generic contemporary civic forum building with restrained monumental columns and broad public steps, shown as an atmospheric architectural illustration at blue hour, no recognizable real-world government building, no Capitol silhouette, no flags, no seal, no signage, no national symbols, no people. Charcoal stone, deep forest-green shadows, subtle warm gold interior lights and a very restrained lime edge light; premium realistic editorial rendering, clear architectural silhouette, readable at 80x54 pixels. The image is fictional scene-setting, not documentary news photography or a claim about any real institution. No text, letters, numbers, logos, watermarks, emblems, charts, third-party source, or crop from any existing CoinBlink or Golden image. Decorative DEMO art; generate only the image.",
    },
    "ecosystem": {
        "assetId": "CB-M01-R26-EDITORIAL-ECOSYSTEM",
        "region": "editorial-ecosystem",
        "generatedOutputName": "exec-da3826ae-0607-44f5-bca5-400a191341f4.png",
        "prompt": "Create one original static editorial thumbnail illustration for a premium dark crypto research DEMO site, landscape 3:2 composition, crop-safe at 1.5:1 and square. An abstract flourishing digital ecosystem depicted as several small luminous teal, mint, and violet glass nodes connected by delicate curved light paths above a dark rocky island/garden at night, subtle mist, layered depth, a small dawn-like lime glow near the horizon. Use an organic irregular constellation, not a recognizable Solana or other token logo, no repeated slanted stripes, no circles forming a brand mark, no UI/dashboard. Deep blue-green near-black background; premium realistic editorial art direction with a crisp, high-contrast center composition, readable at 80x54 pixels. No text, letters, numbers, charts, currency symbols, logos, watermarks, people, factual data, third-party source, or crop from any existing CoinBlink or Golden image. Fictional decorative DEMO art, not a factual news photograph; generate only the image.",
    },
}


def main() -> None:
    derived = json.loads(DERIVATIVES.read_text(encoding="utf-8"))
    assets = []
    for key, prompt in PROMPTS.items():
        inventory = derived["assets"][key]
        master = inventory["master"]
        assets.append(
            {
                **prompt,
                "assetClass": "STATIC_MASTER_APPROVED_IMAGE_PIPELINE",
                "provider": "OpenAI Codex ImageGen",
                "providerVersion": "NOT_EXPOSED",
                "sourceMaster": {**master, "generatedOutputName": prompt["generatedOutputName"]},
                "derivatives": {
                    kind: {**inventory[kind], "derivedFromMasterSha256": master["sha256"]}
                    for kind in ("png", "webp")
                },
                "goldenReferenceRelation": "VISUAL_GUIDANCE_ONLY_NO_RASTER_EXTRACTION_OR_CROP",
                "derivativeOfGoldenReference": False,
                "rightsReview": "PENDING_OWNER_OR_LEGAL",
                "licenseOrTrademarkClearance": "NOT_ESTABLISHED",
                "ownerVisualApproval": False,
                "commercialPublicationAllowed": False,
                "publicationPermission": False,
                "liveEditorialEligible": False,
                "demoOnly": True,
                "allowedUsage": "LOCAL_OR_NONPUBLIC_DEMO_PREVIEW_ONLY",
                "motionDerivative": "NONE_CREATED",
            }
        )
    manifest = {
        "schemaVersion": 1,
        "workOrder": "CB-M01-WO-001",
        "recordType": "R26_STATIC_IMAGEGEN_MASTER_PROVENANCE",
        "recordedDate": "2026-10-14",
        "productState": "DRAFT_DEMO_ONLY_NOT_PUBLISHED",
        "goldenReference": {
            "path": "assets/reference/coinblink-home-master-dark-1536x864.jpg",
            "sha256": "82cb939ac77d55a4cdc65154809de2b2d0eb25ce0f2ee58c5d26d115e6250df8",
            "use": "VISUAL_GUIDANCE_ONLY_NOT_USED_AS_IMAGE_SOURCE",
        },
        "releaseGate": {
            "rightsReview": "PENDING_OWNER_OR_LEGAL",
            "ownerVisualApproval": False,
            "commercialPublicationAllowed": False,
            "publicationPermission": False,
            "productState": "DEMO",
        },
        "assets": assets,
        "limitations": [
            "The word APPROVED in assetClass identifies the named generation pipeline only; it is not Owner visual approval or legal clearance.",
            "Generated output filenames identify Codex-managed image generation artifacts; provider model version is NOT_EXPOSED.",
            "All generated masters are original inputs, not crops or raster derivatives of the Golden reference.",
            "PNG and WebP previews are resized or re-encoded from the exact ImageGen master; no Blender still was substituted.",
            "Rights, trademark review, Owner visual approval, and commercial publication remain blocked.",
        ],
    }
    OUTPUT.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"assets": len(assets), "output": OUTPUT.relative_to(ROOT).as_posix()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
