---
title: Formats and compatibility
---

## Loose MaterialX

A `.mtlx` file is XML. Referenced textures and libraries typically live beside it. A browser file picker cannot grant access to arbitrary sibling resources; use a portable package or a hosted URL when the material has dependencies.

## Material packages

A `.mtlx.zip` is an ordinary zip containing a MaterialX document and its resources. The package model unifies loose and packaged input. Archives are inspected before use and resource references resolve within the package.

## Geometry and environments

Preview models use glTF/GLB. The material source is still MaterialX. Environments accept equirectangular HDR, EXR, PNG, and JPEG. Neutral studio lighting is generated in HDR; photographs are optional rather than required for startup.

## Validation versus rendering

XML parsing, semantic validation, dependency checks, renderer support checks, and shader compilation are separate stages. A structurally valid document may use constructs unsupported by the current preview backend. Use the viewer's inspection and log panels to distinguish those cases.

The renderer uses Three.js WebGPU with a WebGL2 fallback. MaterialX translation follows the supported Three.js MaterialX path; not all MaterialX extensions or rendering features are implemented.
