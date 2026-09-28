#!/bin/sh
# Validate a library material and render its standard screenshots next to it, as AVIF (the
# mtlx-sample-library convention): plane (the 1 m tile, head-on), closeup (20 cm), totem under
# bridge (relief), and sphere under overcast, which shows gloss and reflection breakup best.
# usage: docs/material-authoring/render.sh submodules/mtlx-sample-library/materials/ai_authored/<name>/<name>.mtlx
set -e
cli="$(dirname "$0")/../../packages/cli/bin/cli.js"
f=$1; d=$(dirname "$f")
node "$cli" check "$f" --strict --rules basic structure types unused
node "$cli" render "$f" -o "$d" --format avif -s 512 --ibl bridge --supersample --view plane closeup totem --timeout 300
node "$cli" render "$f" -o "$d" --format avif -s 512 --ibl overcast --supersample --view sphere --timeout 300
