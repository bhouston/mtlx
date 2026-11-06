#!/usr/bin/env python3
"""Generate short appearance/use notes beside every vehicle preset; --check verifies them."""
import argparse
import json
from pathlib import Path

LIBRARY = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Verify existing descriptions without writing.')
    args = parser.parse_args()
    catalog = json.loads((LIBRARY / 'catalog.json').read_text())
    materials = [m for family in catalog['families'] for m in family['materials']]
    uses = {}
    for source in sorted((LIBRARY / 'tools').glob('material-uses-*.json')):
        group = json.loads(source.read_text())
        duplicates = uses.keys() & group.keys()
        if duplicates:
            raise ValueError(f'Duplicate usage entries in {source.name}: {sorted(duplicates)}')
        uses.update(group)
    expected = {m['name'] for m in materials}
    if set(uses) != expected:
        raise ValueError(f'Usage coverage mismatch: missing={sorted(expected - uses.keys())}, '
                         f'extra={sorted(uses.keys() - expected)}')
    errors = []
    for material in materials:
        name = material['name']
        shader = LIBRARY / material['file']
        if not shader.is_file():
            errors.append(f'{name}: missing MaterialX preset')
            continue
        use = uses[name]
        if not isinstance(use, str) or not use.startswith('Use for rendering ') or not use.endswith('.'):
            errors.append(f'{name}: expected a complete rendering-use sentence')
            continue
        text = f'{name}\n\n{material["specification"]}\n\n{use}\n'
        destination = shader.with_suffix('.txt')
        if args.check:
            if not destination.is_file() or destination.read_text() != text:
                errors.append(f'{name}: description is missing or out of date')
        else:
            destination.write_text(text)
    if args.check:
        actual = {p.relative_to(LIBRARY).as_posix() for p in LIBRARY.glob('*/*.txt')}
        expected_files = {str(Path(m['file']).with_suffix('.txt')) for m in materials}
        if actual != expected_files:
            errors.append(f'Description file coverage mismatch: missing={sorted(expected_files - actual)}, '
                          f'extra={sorted(actual - expected_files)}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'{"Verified" if args.check else "Wrote"} {len(materials):,} material descriptions.')


if __name__ == '__main__':
    main()
