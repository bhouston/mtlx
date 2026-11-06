#!/usr/bin/env python3
"""Rebuild the linked index and portable catalog from VEHICLE_MATERIAL_CATALOG.md."""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[3]
LIBRARY = ROOT / 'material_library/vehicle'
source = (ROOT / 'VEHICLE_MATERIAL_CATALOG.md').read_text()
families = []
for title, body in re.findall(r'^## (.+)\n([\s\S]*?)(?=^## |\Z)', source, re.M):
    materials = [
        {'name': name, 'specification': description, 'file': f'{name}/{name}.mtlx'}
        for name, description in re.findall(r'^- `([^`]+)` — (.+)$', body, re.M)
    ]
    if materials:
        families.append({'family': title, 'materials': materials})
assert sum(len(f['materials']) for f in families) == 1404
(LIBRARY / 'catalog.json').write_text(json.dumps({
    'uvMetersPerUnit': 1, 'heightUnits': 'meter', 'families': families,
}, indent=2) + '\n')
lines = ['# Vehicle material index', '',
         'UV 0–1 = one meter. Each link opens a standalone procedural MaterialX preset.', '']
for family in families:
    lines += ['## ' + family['family'], '', f'{len(family["materials"])} presets.', '']
    lines += [f'- [{m["name"]}]({m["file"]}) — {m["specification"]}' for m in family['materials']]
    lines += ['']
(LIBRARY / 'INDEX.md').write_text('\n'.join(lines))
print('Indexed 1,404 materials in 31 families.')
