#!/usr/bin/env python3
"""Import visually approved API outputs: --ids living-rooms-4k-01,shops-4k-01."""

import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import tempfile

from PIL import Image


PARENT_FIELDS = ('title', 'description', 'alt', 'src', 'preview', 'width', 'height', 'kind', 'yaw', 'pitch',
                 'prompt', 'model', 'sourcePath', 'sourceSha256', 'provenance')


def write_if_changed(path, data):
    if path.exists() and path.read_bytes() == data:
        return
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix='.panorama-', delete=False) as stream:
        temporary = Path(stream.name)
        try:
            stream.write(data)
            stream.close()
            os.replace(temporary, path)
        finally:
            temporary.unlink(missing_ok=True)


def import_approved(root, approved_ids):
    root = Path(root).resolve()
    if not approved_ids or len(set(approved_ids)) != len(approved_ids):
        raise ValueError('Provide a nonempty list of distinct, visually approved IDs.')
    if any(not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', item) for item in approved_ids):
        raise ValueError('Approved IDs must contain only lowercase letters, numbers and hyphens.')
    jobs = {}
    for line in (root / 'content/panorama-4k-jobs.jsonl').read_text().splitlines():
        if not line.strip():
            continue
        job = json.loads(line)
        if job['id'] in jobs:
            raise ValueError(f'Duplicate job ID: {job["id"]}')
        jobs[job['id']] = job
    unknown = set(approved_ids) - jobs.keys()
    if unknown:
        raise ValueError(f'Unknown approved IDs: {", ".join(sorted(unknown))}')
    manifest = root / 'content/panoramas.json'
    rooms = json.loads(manifest.read_text())
    if (not isinstance(rooms, list) or len(rooms) != 12
            or len({room['id'] for room in rooms}) != 12
            or len({room['category'] for room in rooms}) != 12):
        raise ValueError('The panorama manifest must retain twelve distinct parent categories.')
    categories = {room['category'] for room in rooms}
    original_bedrooms = {
        design['id']: design for room in rooms for design in room.get('designs', [room])
        if design.get('kind') == 'existing-visualisation' and room['category'] == 'Bedrooms'
    }
    if not {f'bedroom-suite-{number:02d}' for number in range(1, 5)} <= original_bedrooms.keys():
        raise ValueError('The four existing bedroom views must be present before importing.')
    additions, assets = {}, []
    # Validate and decode the complete requested batch before changing any project file.
    for approved_id in approved_ids:
        job = jobs[approved_id]
        if job['category'] not in categories:
            raise ValueError(f'Unknown category: {job["category"]}')
        if job.get('size') != '3840x1920' or job.get('output_format') != 'webp':
            raise ValueError(f'Job is not a native 3840x1920 WebP request: {approved_id}')
        if job.get('out', approved_id + '.webp') != approved_id + '.webp':
            raise ValueError(f'Unexpected output filename: {approved_id}')
        for field in ('title', 'description', 'alt', 'prompt'):
            if not isinstance(job.get(field), str) or not job[field].strip():
                raise ValueError(f'Missing {field}: {approved_id}')
        source = root / 'output/imagegen/panoramas-4k' / (approved_id + '.webp')
        full_bytes = source.read_bytes()
        with Image.open(io.BytesIO(full_bytes)) as image:
            if image.format != 'WEBP' or image.size != (3840, 1920):
                raise ValueError(f'{approved_id}: expected decoded WebP 3840x1920, got {image.format} {image.size}')
            image.load()
            if getattr(image, 'n_frames', 1) != 1 or image.getexif().get(274, 1) != 1:
                raise ValueError(f'{approved_id}: expected one unrotated panorama')
            preview = image.convert('RGB')
            preview.thumbnail((1200, 600), Image.Resampling.LANCZOS)
            encoded_preview = io.BytesIO()
            preview.save(encoded_preview, 'WEBP', quality=85, method=6)
        destination = root / 'img/panoramas/4k' / (approved_id + '.webp')
        preview_path = destination.with_name(approved_id + '-preview.webp')
        design = {field: job[field] for field in ('id', 'category', 'title', 'description', 'alt', 'prompt')}
        design.update({
            'src': '/' + destination.relative_to(root).as_posix(),
            'preview': '/' + preview_path.relative_to(root).as_posix(),
            'width': 3840, 'height': 1920, 'kind': 'generated-panorama',
            'yaw': job.get('yaw', 180), 'pitch': job.get('pitch', 0),
            'model': 'gpt-image-2', 'sourcePath': source.relative_to(root).as_posix(),
            'sourceSha256': hashlib.sha256(full_bytes).hexdigest(),
            'provenance': 'AI-generated design concept; not a documented client project',
        })
        additions.setdefault(job['category'], []).append(design)
        assets.extend(((destination, full_bytes), (preview_path, encoded_preview.getvalue())))
    for room in rooms:
        incoming = additions.get(room['category'])
        if not incoming:
            continue
        incoming_ids = {design['id'] for design in incoming}
        retained = [
            design for design in room.get('designs', [dict(room)])
            if design['id'] not in incoming_ids
            and not (design.get('kind') == 'generated-panorama'
                     and (design['width'] < 3840 or design['height'] < 1920))
        ]
        # Approved new views open first; all existing visualisations and earlier 4K views remain selectable.
        room['designs'] = incoming + retained
        room.update({field: incoming[0][field] for field in PARENT_FIELDS})
    after_bedrooms = {
        design['id']: design for room in rooms for design in room.get('designs', [room])
        if design.get('kind') == 'existing-visualisation' and room['category'] == 'Bedrooms'
    }
    if after_bedrooms != original_bedrooms:
        raise ValueError('Import would change existing bedroom views.')
    for path, data in assets:
        path.parent.mkdir(parents=True, exist_ok=True)
        write_if_changed(path, data)
    write_if_changed(manifest, (json.dumps(rooms, ensure_ascii=False, indent=2) + '\n').encode())
    return {'approvedIds': approved_ids, 'parentCategories': len(rooms),
            'panoramicDesigns': sum(len(room.get('designs', [room])) for room in rooms)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ids', required=True, help='Comma-separated IDs already visually approved by the operator')
    args = parser.parse_args()
    try:
        result = import_approved(Path(__file__).resolve().parents[1], [value.strip() for value in args.ids.split(',')])
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, f'Panorama import failed: {error}\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
