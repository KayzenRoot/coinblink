"""Derive the bounded R25 browser motion WebP from the inventoried Blender render."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image


SCRIPT = Path(__file__).resolve()
EVIDENCE = SCRIPT.parent
ROOT = EVIDENCE.parents[2]
SOURCE = EVIDENCE / "hero-cinematic-motion-preview.webp"
OUTPUT = ROOT / "src" / "modules" / "CB-M01" / "hero-cinematic-motion.webp"
OUTPUT_SIZE = (640, 320)
MAX_BYTES = 1_500_000


def frame_durations(payload: bytes) -> list[int]:
    if len(payload) < 12 or payload[:4] != b"RIFF" or payload[8:12] != b"WEBP":
        raise ValueError("Source must be a WebP RIFF container")
    declared_size = int.from_bytes(payload[4:8], "little") + 8
    if declared_size != len(payload):
        raise ValueError("Source WebP RIFF size does not match the file")
    values: list[int] = []
    offset = 12
    while offset + 8 <= len(payload):
        tag = payload[offset:offset + 4]
        chunk_size = int.from_bytes(payload[offset + 4:offset + 8], "little")
        chunk_start = offset + 8
        chunk_end = chunk_start + chunk_size
        if chunk_end > len(payload):
            raise ValueError("Source WebP has a truncated chunk")
        if tag == b"ANMF":
            if chunk_size < 16:
                raise ValueError("Source WebP has a malformed animation frame")
            values.append(int.from_bytes(payload[chunk_start + 12:chunk_start + 15], "little"))
        offset = chunk_end + (chunk_size % 2)
    if offset != len(payload) or not values:
        raise ValueError("Source WebP animation frame table is incomplete")
    return values


def main() -> None:
    source_bytes = SOURCE.read_bytes()
    durations = frame_durations(source_bytes)
    if len(durations) != 96 or sum(durations) != 4_000:
        raise ValueError("Source motion must contain 96 frames and 4,000 ms")

    frames: list[Image.Image] = []
    derived_durations: list[int] = []
    with Image.open(SOURCE) as source:
        if source.size != (1_600, 800) or source.n_frames != len(durations):
            raise ValueError("Source motion geometry does not match its R25 manifest")
        for source_index in range(0, source.n_frames, 2):
            source.seek(source_index)
            source.load()
            frames.append(source.convert("RGB").resize(OUTPUT_SIZE, Image.Resampling.LANCZOS))
            derived_durations.append(durations[source_index] + durations[source_index + 1])

    frames[0].save(
        OUTPUT,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=derived_durations,
        loop=0,
        quality=72,
        method=4,
        minimize_size=False,
    )

    output_bytes = OUTPUT.read_bytes()
    output_durations = frame_durations(output_bytes)
    with Image.open(OUTPUT) as output:
        if output.size != OUTPUT_SIZE or output.n_frames != 48:
            raise ValueError("Derived motion must be 640x320 with 48 frames")
    if sum(output_durations) != 4_000 or len(output_bytes) > MAX_BYTES:
        raise ValueError("Derived motion duration or 1.5 MB budget is invalid")

    print(json.dumps({
        "source": SOURCE.relative_to(ROOT).as_posix(),
        "sourceSha256": hashlib.sha256(source_bytes).hexdigest(),
        "output": OUTPUT.relative_to(ROOT).as_posix(),
        "outputSha256": hashlib.sha256(output_bytes).hexdigest(),
        "outputBytes": len(output_bytes),
        "dimensions": list(OUTPUT_SIZE),
        "frameCount": len(output_durations),
        "durationMs": sum(output_durations),
        "quality": 72,
        "method": 4,
        "maxBytes": MAX_BYTES,
    }, indent=2))


if __name__ == "__main__":
    main()
