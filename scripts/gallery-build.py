#!/usr/bin/env python3
"""Build the complete existing-image gallery; requires Pillow, preserves originals.

Run manually after changing original gallery images: python3 scripts/gallery-build.py
This is an asset preparation command, not a dependency of the Node site build.
Only exact file/pixel duplicates are merged. Distinct designs are always retained.
"""
from collections import Counter, defaultdict
from hashlib import sha256
from pathlib import Path
import json

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'img/gallery'
CATEGORY_ORDER = ['Living rooms', 'Kitchens', 'Bedrooms', 'Wardrobes', 'Dining', 'Pooja', 'Kids', 'Workspaces', 'Shops', 'Bathrooms', 'Balconies', 'Renovation', 'Portfolio']
FOLDERS = {
    'living-room': 'Living rooms', 'modular-kitchen': 'Kitchens', 'bed-room': 'Bedrooms',
    'wardrobe': 'Wardrobes', 'dining-room': 'Dining', 'pooja-room': 'Pooja',
    'kids-bed-room': 'Kids', 'home-office': 'Workspaces', 'office': 'Workspaces',
    'shop': 'Shops', 'bathroom': 'Bathrooms', 'balcony': 'Balconies',
    'renovation': 'Renovation', 'portfolio': 'Portfolio', 'intro-carousel': 'Portfolio',
}

# Descriptions are based on visual inspection of the existing source collection.
# They describe what is visible, without claiming a client, location or completion.
DESCRIPTIONS = {
    'living-room': [
        ('Soft grey, clean lines', 'Grey sofa beneath pendant lights beside a pale panelled feature wall'),
        ('A room with a view', 'Grey living room seating arranged around low tables beside wide windows'),
        ('Room to gather', 'Facing sofas with a central coffee table and a recessed television wall'),
        ('Colour by the window', 'Living room with colourful cushions, framed artwork and tall corner windows'),
        ('A relaxed family corner', 'Casual seating with colourful cushions, indoor plants and low wooden tables'),
        ('Warmth in colour', 'Living room with a teal sofa, bright cushions and plants beside tall windows'),
        ('A quieter TV wall', 'Pale television wall with storage, an armchair and a timber coffee table'),
        ('Layered light and greenery', 'Living room television wall framed by warm shelving lights and trailing greenery'),
    ],
    'modular-kitchen': [
        ('A useful central island', 'Grey kitchen cabinetry with a white island worktop and breakfast stools'),
        ('Dark cabinets, warm light', 'Dark wood kitchen with an island, open shelves and warm task lighting'),
        ('Natural light at the island', 'Timber kitchen with a central island, hanging lights and tall windows'),
        ('A calm corner kitchen', 'Pale L-shaped cabinets with a blue splashback and a bright corner window'),
        ('An everyday breakfast spot', 'White kitchen with a long counter, low stools and a corner sink'),
        ('Timber and a garden view', 'Timber kitchen island with a pale countertop and large garden-facing windows'),
        ('A bright island layout', 'White kitchen island with black accents, breakfast stools and broad windows'),
        ('A little mustard yellow', 'Compact kitchen with white lower cabinets and mustard yellow upper cupboards'),
    ],
    'bed-room': [
        ('Colour and carved wood', 'Bedroom with carved timber furniture, patterned curtains and a blue bed runner'),
        ('A warm yellow accent', 'Bedroom with a yellow feature wall, low bed and dark wood storage'),
        ('A place to unwind', 'Neutral bedroom with a recessed ceiling, long curtains and seating by the window'),
        ('Timber behind the bed', 'Bedroom with a timber panelled headboard wall and a low upholstered bed'),
        ('A fresh green detail', 'Bedroom with green accent panels, a patterned headboard and built-in cupboards'),
        ('Warm wood, soft lighting', 'Bedroom with warm wood wall panels, bedside lighting and a teal bed runner'),
        ('A bright bedside wall', 'Bedroom with a yellow wall accent, framed artwork and a low upholstered bed'),
        ('Rich timber and teal', 'Bedroom with dark timber furniture, teal bedding and sunlight from a wide window'),
    ],
    'wardrobe': [
        ('Storage in warm timber', 'Open timber wardrobe with hanging rails, drawers and shoe shelves beside a window'),
        ('A place for every layer', 'Open wardrobe with hanging clothes, drawers and softly illuminated shelves'),
        ('Simple pale storage', 'Pale wardrobe with open doors, hanging clothes and a central drawer stack'),
        ('Drawers within reach', 'Open light-coloured wardrobe with hanging rails and a bank of drawers'),
        ('A walk-in wardrobe', 'Walk-in wardrobe with timber shelving, hanging rails and a pink rug'),
        ('Shoes, shelves and rails', 'Timber wardrobe with separate hanging sections, open shelves and shoe storage'),
        ('A balanced storage layout', 'Light wardrobe with symmetrical hanging sections and central drawers'),
        ('Storage along the wall', 'Bedroom corner with dark open wardrobes and a central pale drawer unit'),
    ],
    'home-office': [
        ('A desk beside the window', 'Home workspace with a timber desk, open shelving and a black feature wall'),
        ('A light-filled work corner', 'Timber desk and chair beside open shelving, plants and a large window'),
        ('Natural light for work', 'Wooden home-office desk with woven window blinds and leafy indoor plants'),
        ('Space for everyday work', 'Home workspace with a timber desk, wall shelves and plants around the window'),
        ('A quiet botanical corner', 'Home-office desk beneath botanical prints with a comfortable chair and plants'),
        ('A darker study', 'Dark home office with a long timber desk, open shelves and a black task chair'),
        ('Books around the desk', 'Home-office desk surrounded by timber bookshelves and plants beside a window'),
        ('Compact and considered', 'Small workspace with a white chair, timber desk and dark open shelving'),
    ],
    'office': [
        ('A bright shared workspace', 'Open-plan office with white desks, orange task chairs and broad windows'),
        ('Desks with daylight', 'Shared timber worktables with pale chairs and indoor plants beside tall windows'),
        ('An open office layout', 'Long shared desks with black task chairs beneath an exposed-services ceiling'),
        ('A clear desk layout', 'Office with rows of workstations, bright ceiling panels and low desk dividers'),
        ('Room for collaboration', 'Office with timber worktables, orange chairs, tall windows and hanging plants'),
        ('Flexible working space', 'Bright office with open desks, black task chairs and an exposed white ceiling'),
        ('A little green at work', 'Office with lime green desk partitions, black chairs and a long window wall'),
        ('A shared place to work', 'Open office with long workstations, orange chairs and indoor planting'),
    ],
    'shop': [
        ('A clear retail aisle', 'Clothing shop with central display tables, wall shelving and a bright ceiling'),
        ('Display with room to browse', 'Retail shop with pale display islands, wall shelves and geometric lighting'),
        ('Timber retail shelving', 'Clothing shop with timber shelving, hanging rails and dark ceiling track lights'),
        ('A well-lit shop floor', 'Clothing shop with wood-framed shelving, hanging rails and central display counters'),
        ('A colourful clothing display', 'Bright clothing shop with colourful garments, white counters and a timber floor'),
        ('Shelves along the aisle', 'Retail interior with stocked timber shelving, a central aisle and warm lighting'),
        ('An organised clothing shop', 'Clothing shop with hanging garments, shoe shelves and warm ceiling spotlights'),
        ('A layered retail display', 'Retail shop with timber wall shelves, display counters and integrated warm lighting'),
    ],
    'bathroom': [
        ('Space around the bath', 'Neutral bathroom with a freestanding bath, long vanity and natural light'),
        ('A calm bathing space', 'Bathroom with a long vanity, glass shower screen and a bath beside the window'),
        ('Light at the vanity', 'Warm neutral bathroom with a pale countertop, recessed lighting and a tall window'),
        ('Built-in bathroom storage', 'Bathroom with a long vanity, recessed shelving and a built-in bath'),
        ('A bright shower corner', 'Bathroom with a glass shower enclosure, round mirror and floating timber vanity'),
        ('A clear bathroom layout', 'Bathroom with a freestanding bath, large mirror and floating vanity storage'),
        ('Light and natural finishes', 'Bathroom with a long floating vanity, open shelves and a freestanding bath'),
        ('Simple lines at the vanity', 'Modern bathroom with pale walls, a long floating vanity and integrated ceiling lights'),
    ],
    'balcony': [
        ('A sunset coffee corner', 'Balcony with a small round table, chairs, hanging greenery and a sunset view'),
        ('An open balcony edge', 'Long bright balcony with a pale timber floor, glass doors and a distant hillside view'),
        ('A quiet outdoor seat', 'Covered balcony with pale lounge seating, a small round table and a glass railing'),
        ('A planted balcony corner', 'Balcony seating with a wicker chair, cushions, terracotta pots and leafy plants'),
        ('A table above the city', 'Sunlit balcony with a small table, two chairs and plants along a metal railing'),
        ('Greenery at the doorway', 'Balcony with a timber floor, pale curtains, a small chair and clustered potted plants'),
        ('A little outdoor living room', 'Balcony with a pale sofa, wicker furniture and a collection of leafy plants'),
        ('A shaded balcony retreat', 'Covered balcony with wicker chairs, a small table and planting beside the railing'),
    ],
    'renovation': [
        ('A living room comparison', 'Split-view design reference showing an unfinished room above a furnished living room'),
        ('A kitchen layout comparison', 'Split-view design reference comparing an older kitchen with a brighter island layout'),
        ('A lighter living space', 'Before-and-after design reference comparing two living room arrangements'),
        ('Opening up a living room', 'Split-view living room design reference with pale finishes and a broad window'),
        ('Four views of a room', 'Four-panel renovation design reference showing different stages of a living room'),
        ('A change in layout', 'Before-and-after room design reference with a new divider and pale lounge seating'),
        ('A brighter kitchen idea', 'Before-and-after kitchen design reference with pale cabinets and a central island'),
        ('A kitchen in transition', 'Kitchen renovation reference with unfinished surfaces beside newly fitted pale cabinets'),
    ],
}

SPECIAL = {
    'img/about-img.png': ('Living rooms', 'Soft seating, bright cushions', 'Close view of a grey sofa with yellow and patterned cushions beside a timber coffee table'),
    'img/why-us.png': ('Living rooms', 'A softly lit sitting room', 'Living room with a grey sectional sofa, dark coffee table and warm recessed lighting'),
    'living-room/living-room.png': ('Living rooms', 'Colour, comfort and texture', 'Living room with a teal sofa, colourful cushions, framed artwork and a wooden coffee table'),
    'modular-kitchen/modular-kitchen.png': ('Kitchens', 'A compact grey kitchen', 'Compact grey kitchen with open shelves, an extractor hood and light timber flooring'),
    'bed-room/bed-room.png': ('Bedrooms', 'A restful neutral bedroom', 'Neutral bedroom with a grey bed, soft curtains and a desk beside the window'),
    'wardrobe/wardrobe.png': ('Wardrobes', 'A dressing room in timber', 'Walk-in wardrobe with timber drawers, hanging storage and illuminated shoe shelves'),
    'bathroom/bathroom.png': ('Bathrooms', 'A bath beside the window', 'Bathroom with a freestanding bath, timber wall panels and a rounded vanity'),
    'balcony/balcony.png': ('Balconies', 'A green balcony nook', 'Narrow balcony with a small round table, wicker chairs and layers of potted plants'),
    'renovation/renovation.png': ('Renovation', 'A room made lighter', 'Split-view renovation design reference contrasting an unfinished room with a furnished sitting area'),
    'dining-room/dining-room.png': ('Dining', 'A table for everyday gathering', 'Dining room with a timber table, blue chairs, pendant lights and a pale panelled wall'),
    'pooja-room/pooja-room.png': ('Pooja', 'A dedicated pooja space', 'Pooja room with a raised altar, patterned wall panels and warm recessed lighting'),
    'kids-bed-room/kids-bed-room.png': ('Kids', 'Room to grow and play', 'Childrens bedroom with a loft bed, timber storage, books and colourful bedding'),
    'intro-carousel/1.png': ('Living rooms', 'Living around the view', 'Bright living room with a grey sofa, colourful cushions and a timber television wall'),
    'intro-carousel/2.png': ('Kitchens', 'Kitchen and breakfast together', 'Bright kitchen with a white island, timber breakfast stools and a mustard wall accent'),
    'intro-carousel/3.png': ('Living rooms', 'Warm accents in a bright room', 'Living room with grey and mustard seating, tall windows and timber wall detailing'),
    'portfolio/1.jpg': ('Bedrooms', 'Blue stripes behind the bed', 'Bedroom with a blue-striped headboard wall, matching bedding and a black-and-white dresser'),
    'portfolio/2.jpg': ('Dining', 'A sculptural pink interior', 'Pink dining interior with sculptural seating, round white tables and a curved illuminated ceiling'),
    'portfolio/3.jpg': ('Living rooms', 'Low seating by the window', 'Living room with low lounge chairs, a red television cabinet and broad garden-facing windows'),
    'portfolio/4.jpg': ('Living rooms', 'An open-plan planted space', 'Open-plan interior with a planted central divider, timber flooring and a staircase'),
    'portfolio/5.jpg': ('Bedrooms', 'A simple monochrome bedroom', 'Bedroom with white wardrobes, a black horizontal band and a matching dresser'),
    'portfolio/5.webp': ('Living rooms', 'An orange accent at home', 'Living room with orange seating, a glass coffee table and a pale television wall'),
    'portfolio/6.jpg': ('Living rooms', 'A long, light living room', 'Living room with pale seating, a dark coffee table and horizontal window blinds'),
    'portfolio/7.jpg': ('Bedrooms', 'A purple bedroom palette', 'Bedroom with purple walls, matching bedding, a chandelier and floral artwork'),
    'portfolio/8.webp': ('Kids', 'Storage around a study corner', 'Childrens room with blue walls, a timber wardrobe, a study desk and a low beanbag'),
    'portfolio/9.webp': ('Living rooms', 'A floating media console', 'Television wall with a long floating console, open shelves and warm timber flooring'),
    'portfolio/10.webp': ('Kitchens', 'Blue above, white below', 'Kitchen with blue upper cabinets, white lower storage and a white refrigerator'),
    'portfolio/11.webp': ('Kitchens', 'A kitchen with a breakfast ledge', 'White kitchen cabinets with a pale splashback and a breakfast counter with green stools'),
    'portfolio/12.webp': ('Kitchens', 'Dark timber in the kitchen', 'Kitchen with dark timber cabinets, a dark splashback and a mobile drawer island'),
    'portfolio/13.webp': ('Living rooms', 'A floating media console', 'Television wall with a long floating console, open shelves and warm timber flooring'),
    'portfolio/14.webp': ('Dining', 'Dining beside the kitchen', 'Round timber dining table with white chairs beside pale kitchen cabinetry'),
    'portfolio/15.webp': ('Kitchens', 'A softly lit corner kitchen', 'Pale green kitchen cabinets with a dark countertop and warm under-cabinet lighting'),
    'portfolio/16.webp': ('Living rooms', 'A small reading corner', 'Green upholstered reading chair beside a tall window and a timber bookcase'),
    'portfolio/17.webp': ('Living rooms', 'Green walls, grey seating', 'Living room with green wall panelling, a grey sofa and patterned cushions'),
    'portfolio/18.webp': ('Living rooms', 'A bold blue and yellow room', 'Living room with blue walls, a yellow sofa, patterned cushions and a chandelier'),
    'portfolio/19.webp': ('Living rooms', 'Pattern and deep red seating', 'Living room with a red patterned sofa, framed artwork and a round glass table'),
    'portfolio/20.jpg': ('Living rooms', 'A light-filled lounge', 'Bright living room with pale sofas, accent chairs and tall windows'),
    'portfolio/21.webp': ('Living rooms', 'Grey seating and timber tables', 'Living room with grey sofas, nesting timber tables, framed artwork and indoor plants'),
    'portfolio/22.webp': ('Living rooms', 'A colourful sitting room', 'Living room with green and yellow seating, colourful cushions and a patterned floor'),
    'portfolio/23.webp': ('Wardrobes', 'Open storage in a small space', 'Open wardrobe with a pale drawer unit, hanging clothes and shelf storage'),
    'portfolio/24.webp': ('Living rooms', 'Texture behind the television', 'Living room television mounted on a textured grey wall with floating storage below'),
}


def description(path):
    key = f'{path.parent.name}/{path.name}'
    if key in SPECIAL:
        return SPECIAL[key]
    if path.stem.isdigit() and path.parent.name in DESCRIPTIONS:
        label, alt = DESCRIPTIONS[path.parent.name][int(path.stem) - 1]
        return FOLDERS[path.parent.name], label, alt
    # New originals stay included; adding a specific description is recommended.
    category = FOLDERS[path.parent.name]
    return category, f'{category} design {path.stem.replace("-", " ")}', f'{category} design from the existing Alankaar Interiors gallery'


def make_variant(image, path, edge, quality):
    resized = image.copy()
    resized.thumbnail((edge, edge), Image.Resampling.LANCZOS)
    resized.save(path, 'WEBP', quality=quality, method=6)
    return resized.size


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    files = sorted(path for folder in FOLDERS for path in (ROOT / 'img' / folder).glob('*') if path.is_file() and path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'})
    # These two original section images are standalone room views, not collages.
    files.extend(path for name in ['about-img.png', 'why-us.png'] if (path := ROOT / 'img' / name).is_file())
    pixel_groups = {}
    items = []
    for path in files:
        image = ImageOps.exif_transpose(Image.open(path)).convert('RGB')
        digest = sha256(str(image.size).encode() + image.tobytes()).hexdigest()
        original = '/' + path.relative_to(ROOT).as_posix()
        if digest in pixel_groups:
            pixel_groups[digest]['originalPaths'].append(original)
            continue
        category, label, alt = description(path)
        item_id = f'{path.parent.name}-{path.stem}-{path.suffix[1:].lower()}'
        thumb_name = f'{item_id}-600.webp'
        full_name = f'{item_id}-1400.webp'
        thumb_width, thumb_height = make_variant(image, OUT / thumb_name, 600, 76)
        full_width, full_height = make_variant(image, OUT / full_name, 1400, 84)
        item = {
            'id': item_id, 'src': original, 'thumbnail': f'/img/gallery/{thumb_name}',
            'full': f'/img/gallery/{full_name}', 'width': image.width, 'height': image.height,
            'thumbnailWidth': thumb_width, 'thumbnailHeight': thumb_height,
            'fullWidth': full_width, 'fullHeight': full_height,
            'category': category, 'label': label, 'alt': alt, 'originalPaths': [original],
        }
        pixel_groups[digest] = item
        items.append(item)
    buckets = defaultdict(list)
    for item in items:
        buckets[item['category']].append(item)
    # Interleave rooms so the first gallery page represents the breadth of designs.
    ordered = []
    while any(buckets.values()):
        for category in CATEGORY_ORDER:
            if buckets[category]:
                ordered.append(buckets[category].pop(0))
    counts = Counter(item['category'] for item in ordered)
    manifest = {
        'version': 1,
        'sourceFileCount': len(files),
        'imageCount': len(ordered),
        'provenance': 'Existing Alankaar Interiors website image collection. Images include design references; this catalogue does not assert a client, location, photographer, original licence or completed project. Originals are preserved in originalPaths.',
        'categories': [category for category in CATEGORY_ORDER if counts[category]],
        'categoryCounts': {category: counts[category] for category in CATEGORY_ORDER if counts[category]},
        'items': ordered,
    }
    (ROOT / 'content/gallery.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    generated_names = {Path(item[k]).name for item in items for k in ('thumbnail', 'full')}
    for old in OUT.glob('*.webp'):
        if old.name not in generated_names:
            old.unlink()
    byte_count = sum((OUT / name).stat().st_size for name in generated_names)
    print(json.dumps({'originals': len(files), 'distinctImages': len(items), 'duplicatesMerged': len(files) - len(items), 'categories': dict(counts), 'optimisedFiles': len(generated_names), 'optimisedBytes': byte_count}, indent=2))


if __name__ == '__main__':
    main()
