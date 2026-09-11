# Reading untrusted material packages

XML parsing and ZIP inspection apply resource limits before constructing the document tree or
decompressing archive entries. The limits are shared by the browser-safe APIs and the Node helpers.

| Limit               | Default                          | Purpose                                            |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| `maxXmlBytes`       | 16 MiB of UTF-8                  | Bound validator/parser input and document memory   |
| `maxXmlDepth`       | 128 elements, including the root | Bound recursion in document traversal              |
| `maxXmlElements`    | 100,000, including the root      | Bound tree construction and validation work        |
| `maxArchiveBytes`   | 128 MiB                          | Bound compressed input processed by the ZIP reader |
| `maxArchiveEntries` | 4,096, including directories     | Bound central-directory and per-entry overhead     |
| `maxEntryBytes`     | 128 MiB                          | Bound any single expanded resource                 |
| `maxExpandedBytes`  | 512 MiB                          | Bound total expanded archive resources             |

These are operational defaults, not MaterialX specification restrictions. They provide room for
thousands of nodes and multiple large textures while rejecting unbounded input. Large production
materials, especially UDIM collections, may need deliberate higher budgets. Memory use can exceed
the expanded-byte budget because decoding, temporary buffers, the document tree, and rendering also
consume memory. Browser applications targeting constrained devices should choose lower limits.

```ts
import { inspectMaterialXZipArchive, parseMaterialX } from 'mtlx-core';

const archive = inspectMaterialXZipArchive(bytes, {
  maxArchiveBytes: 32 * 1024 * 1024,
  maxExpandedBytes: 128 * 1024 * 1024,
});
const document = parseMaterialX(xmlText, { maxXmlDepth: 64 });
```

Overrides must be positive safe integers. `parseMaterialX` throws a descriptive error when a limit
is exceeded. `inspectMaterialXZipArchive` and the `check*` APIs report error issues; archive rejection
returns no partial entries. `checkMaterialXZipArchive(bytes, limits)` forwards the XML limits to
root-document validation. `checkMaterialXText(xml, location, limits)` also accepts overrides.

The ZIP reader scans all declared sizes before inflating any entry, then checks actual emitted sizes
while streaming small compressed chunks. A forged small directory size cannot bypass the actual
output checks. Duplicate paths are rejected by both the archive reader and writer. DTD and entity
declarations are unsupported, so the XML parser cannot expand a declared entity graph.

These limits bound work; they do not make synchronous parsing nonblocking. Applications requiring
continuous UI responsiveness should parse in a worker and set budgets appropriate to their devices.
Test the budgets on your actual material corpus before raising them.

## Local fixture check

The September 11, 2026 local check accepted both checked-in archives (`copper.mtlx.zip` and
`wood_grain.mtlx.zip`) and all four checked-in loose documents with the defaults. The archives
expanded to 724 bytes / 1 entry and 4,494 bytes / 3 entries. Over 100 warm local iterations, median
archive inspection times were approximately 0.04 ms and 0.16 ms; XML preflight medians were below
0.03 ms for the loose documents (724–8,273 bytes). These tiny fixtures check compatibility, not
production throughput, browser responsiveness, or large texture/UDIM workloads. No performance
guarantee is implied. Regression tests additionally exercise compressed resources, forged output
lengths, streaming ZIP descriptors, duplicate paths, and each resource budget.
