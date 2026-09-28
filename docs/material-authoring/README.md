# Procedural material authoring

Docs and research from the AI-authored procedural MaterialX experiment. **The materials themselves live
in the public [`mtlx-sample-library`](https://github.com/bhouston/mtlx-sample-library)** under
[`materials/ai_authored/`](https://github.com/bhouston/mtlx-sample-library/blob/main/materials/ai_authored/), whose README has the
galleries. New materials go there too (see [AUTHORING.md](AUTHORING.md) §2), where they double as
fidelity test cases across MaterialX renderers.

**Start here:** [REPORT.md](REPORT.md) summarizes the experiment, and
[ROUND_COMPARISON.md](ROUND_COMPARISON.md) has the metrics and before/after comparisons.

**Docs:**

- [AUTHORING.md](AUTHORING.md): workflow, tools, conventions, and the acceptance checklist.
- [NOISE_COOKBOOK.md](NOISE_COOKBOOK.md): noise ranges, rules of thumb, and verified recipes.
- [noise-lab/](noise-lab/): the research behind the cookbook, with swatches and FINDINGS.md.
- [AGENT_FEEDBACK.md](AGENT_FEEDBACK.md): friction reported by the authoring agents, and what was done about it.
- [RENDERER_BUGS.md](RENDERER_BUGS.md): bugs found in the three.js MaterialX renderer.
- [render.sh](render.sh): validate a material and render its standard AVIF screenshots next to it.

Build the CLI first: `cd packages/cli && pnpm build`. To work on the materials, clone the sample library into
the git-ignored `submodules/` folder (shallow, since it also holds large reference renders):
`git clone --depth 1 https://github.com/bhouston/mtlx-sample-library.git submodules/mtlx-sample-library`.
