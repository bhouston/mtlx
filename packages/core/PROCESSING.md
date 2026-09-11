# Preview and run a MaterialX processing pipeline

`processMaterialX` is a Node API for reviewing the same transformations and output paths that a
normal write uses. It accepts one input path or an array of paths to combine.

```ts
import { processMaterialX } from 'mtlx-core/node';
import { resizeTextures } from 'mtlx-core/textures';

const result = await processMaterialX('material.mtlx', 'output/material.mtlx.zip', {
  dryRun: true,
  transforms: [resizeTextures({ maxImageSize: 2048 })],
});

console.log(result.success, result.changes, result.warnings, result.errors);
```

Stages are recorded in order: `parse`, `resolve`, `validate-input`, `plan-transforms`, `transform`,
`validate-output`, `plan-output`, and `commit`. A failure identifies its stage and skips subsequent
stages. Input and output validation defaults to the `basic`, `structure`, `types`, and `resources`
rule sets; pass `validation` to select other rules. Validation is a diagnostic aid, not a claim of
complete MaterialX conformance or renderer compatibility.

A dry run **executes transforms in memory** and reads the filesystem to determine resource reuse
and collision suffixes. It does not create output files or directories. Custom transforms must
honor the transform contract and only mutate the in-memory package; the library cannot prevent a
caller-supplied function from performing its own external side effects. Remove `dryRun: true` to
run the commit stage. A fresh invocation recomputes the plan from current inputs and disk state.

Results include:

- `success`, `dryRun`, inputs, output path, root path, format, and package entry names.
- `stages` with completed, skipped, or failed status and `errors` attributed to their stage.
- `operations` describing requested transforms. Arbitrary functions without a name use positional
  identifiers such as `transform-1`; they cannot provide a predictive internal operation plan.
  A transform that executes without changing serialized XML, resource paths, or bytes is reported
  as `unchanged` and listed in `skippedOperations` with its reason. Detecting this hashes package
  content before and after each transform.
- `changes`, listing every planned filesystem path, write/reuse action, and byte count. Resource
  bytes are omitted from the report so JSON output stays compact.
- `warnings` and `skippedOperations`, including an omitted transform stage and dry-run commit.
- `beforeBytes` and `afterBytes`, measured as uncompressed serialized XML plus resource payloads.
  They are **not** compressed input/output ZIP sizes. `outputBytes` counts planned filesystem bytes,
  including reused files. `bytesWritten` is zero for dry runs and counts writes after a successful
  commit. It does not estimate transient staging writes or report partial failed-commit I/O.

For several dry runs sharing a texture directory, pass the same `plannedFiles: Map<string,
Uint8Array>` to each call. Successful plans reserve virtual file paths so later calls can predict
reuse and collision suffixes without writing them. This context is supported only with `dryRun`.

The current staged loader parses input documents before loading their packages, which repeats
reading/parsing to distinguish parse errors from resource-resolution errors. Plan for this overhead
when processing very large archives.

## CLI

```sh
mtlx x material.mtlx -o output/material.mtlx.zip --dry-run
mtlx x material.mtlx -o output/material.mtlx.zip --profile web --dry-run --format json
mtlx x 'materials/**/*.mtlx' -o output/ --dry-run --format json
```

Single-file/combined mode prints one structured result. Batch mode prints an array including
per-input processing failures and continues with other inputs. Any failed input causes a nonzero
exit status. Failures expanding input patterns produce a structured top-level error in JSON/YAML
mode. Text output says `Would write` for a successful dry run. Batch dry runs share virtual planned
resources, including when `--texture-library` points at a shared directory.
