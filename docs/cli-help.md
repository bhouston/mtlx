# Terminal help reference

Generated from `mtlx --help` and each top-level command. For structured options, see the command reference in the sidebar.

<!-- begin:cli_help -->

```text
mtlx <command> [options]

Commands:
  mtlx check <inputs..>         Run selected document checks on one or more
                                .mtlx or .mtlx.zip files (glob patterns
                                accepted)
  mtlx download [userMaterial]  Download a material file
  mtlx info <input>             Print information about a .mtlx or .mtlx.zip
                                file
  mtlx login                    Authenticate with the MTLX.ai platform
  mtlx logout                   Clear stored authentication
  mtlx mcp                      Run a Model Context Protocol server over stdio
                                (check, inspect, render, and edit tools for AI
                                agents)
  mtlx nodes <query>            Search MaterialX node definitions: exact names,
                                inputs with defaults, and preview-renderer notes
  mtlx render <input>           Render a .mtlx or .mtlx.zip file to an image
                                (png, jpg, webp or avif) using a local headless
                                browser
  mtlx transform <inputs..>     Convert, combine, or resize/reformat textures
                                across one or more .mtlx / .mtlx.zip files (glob
                                patterns accepted), writing --output. A
                                directory --output batch-converts each input
                                separately instead of combining.    [aliases: x]
  mtlx upload <file>            Upload a .mtlx.zip (or .mtlx) file as a new
                                material
  mtlx view <input>             Open a local 3D preview of a .mtlx or .mtlx.zip
                                file in your browser
  mtlx api-tokens               api-tokens commands
  mtlx assets                   assets commands
  mtlx auth                     auth commands
  mtlx comments                 comments commands
  mtlx config                   config commands
  mtlx health                   Check if the API server is healthy and reachable
  mtlx materials                materials commands
  mtlx notifications            notifications commands
  mtlx search <query>           Search public materials (shortcut for `materials
                                list --search`)
  mtlx users                    users commands
  mtlx docgen                   Write the OpenCLI document to a file, or stdout
                                if --output is omitted

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx check <inputs..>

Run selected document checks on one or more .mtlx or .mtlx.zip files (glob
patterns accepted)

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --strict    Fail on warnings as well as errors  [boolean] [default: false]
      --rules     Rule groups to run (default: basic); renderer checks require a
                  capability inventory
                   [array] [choices: "basic", "structure", "types", "resources",
                                                   "renderer-support", "unused"]
      --format    Output format
                             [choices: "text", "json", "yaml"] [default: "text"]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx download [userMaterial]

Download a material file

Positionals:
  userMaterial  <user>/<name>, e.g. alice/copper                        [string]

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --name      Material name (alternative to <user>/<name>)          [string]
  -o, --output    Output file path (defaults to the material name)      [string]
      --user      User name                                             [string]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx info <input>

Print information about a .mtlx or .mtlx.zip file

Positionals:
  input  Path to .mtlx or .mtlx.zip file                     [string] [required]

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --format    Output format
                             [choices: "text", "json", "yaml"] [default: "text"]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx login

Authenticate with the MTLX.ai platform

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -t, --token     Secret API token (st_...) for service account authentication
                                                                        [string]
      --host      API host URL (overrides config)                       [string]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx logout

Clear stored authentication

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx mcp

Run a Model Context Protocol server over stdio (check, inspect, render, and edit
tools for AI agents)

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx nodes <query>

Search MaterialX node definitions: exact names, inputs with defaults, and
preview-renderer notes

Positionals:
  query  Substring of the definition name, category, or node group;
         comma-separate several (e.g. worley,smoothstep,fract)
                                                             [string] [required]

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --limit     Maximum definitions to list             [number] [default: 40]
      --format    Output format      [choices: "text", "json"] [default: "text"]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx render <input>

Render a .mtlx or .mtlx.zip file to an image (png, jpg, webp or avif) using a
local headless browser

Positionals:
  input  Path to .mtlx or .mtlx.zip file                     [string] [required]

Options:
      --parallel     Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -o, --output       Image file to write; .png, .jpg, .webp or .avif picks the
                     format. With several --view, an image path gets a contact
                     sheet; any other path (or an existing directory, or one
                     ending in /) gets <view>.<format> files [string] [required]
      --format       Format of the <view> files when --output is a directory (an
                     image --output uses its extension)
                        [choices: "png", "jpg", "webp", "avif"] [default: "png"]
      --view         Named views rendered in one browser session: plane,
                     closeup, detail, grazing, sphere, totem, cube, or
                     plane:<meters> for a head-on plane of that width (1 UV = 1
                     m)                                                  [array]
  -g, --geometry     Preview geometry
                [choices: "totem", "sphere", "cube", "plane"] [default: "totem"]
  -m, --material     Material name (default: last material in the document)
                                                                        [string]
  -b, --background   Backdrop behind the model; none keeps the IBL lighting but
                     leaves the PNG transparent
                              [choices: "none", "environment"] [default: "none"]
  -s, --size         Image width and height in pixels    [number] [default: 800]
      --ibl          Lighting: studio (generated neutral HDR room), bridge
                     (outdoor, shows relief, green-yellow cast), sun (hard
                     midday sun, strongest relief), overcast (soft medium
                     daylight, near neutral), neutral (colorless grey studio,
                     for judging albedo), strips (dark room with sharp softbox
                     strips, for judging gloss and roughness breakup), dusk
                     (warm, medium-dark street), night (very dark)
   [choices: "studio", "bridge", "sun", "overcast", "neutral", "strips", "dusk",
                                                    "night"] [default: "studio"]
  -e, --exposure     Exposure in stops (-2..2)             [number] [default: 0]
  -z, --zoom         Camera zoom factor for close-ups (1 = default framing)
                                                                        [number]
      --elevation    Camera elevation in degrees (default 35; 0 = head-on to the
                     plane)                                             [number]
      --center       UV point the plane view aims at, e.g. 0.25,0.7     [string]
      --supersample  Render at 2x and downsample (smoother thin features)
                                                      [boolean] [default: false]
      --channel      Show one nodegraph node unlit (floats grey, vectors as rgb)
                     and print its value statistics                     [string]
      --uv-scale     Multiply every texcoord by N, so the 1 m plane shows N × N
                     m (layout checks over several meters)              [number]
      --grid         Overlay UV grid lines every N meters (with labels) on
                     head-on plane views, e.g. 0.1                      [number]
      --crop         Crop x,y,size pixels of each view and enlarge it to --size
                     (nearest neighbour) for pixel-level inspection     [string]
      --mirror       Print how symmetric each head-on plane view is about a UV
                     line, e.g. u=0.15 or v=0.5 (book-match checks)     [string]
      --range        Value range mapped to black..white for --channel, e.g.
                     -0.003,0.002 (default 0,1)                         [string]
      --browser      Chromium-based browser executable (default: installed
                     Chrome, Edge, or Playwright Chromium)              [string]
      --timeout      Seconds to wait for the material to compile and each view
                     to render                            [number] [default: 60]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

```text
mtlx transform <inputs..>

Convert, combine, or resize/reformat textures across one or more .mtlx /
.mtlx.zip files (glob patterns accepted), writing --output. A directory --output
batch-converts each input separately instead of combining.

Texture options:
      --profile                Apply a named texture preset (e.g. "web":
                               webp-preferred, 2048px max, EXRs normalized to
                               PIZ); only touches incompatible textures
                                                                [choices: "web"]
      --max-image-size         Resize any texture whose longest edge exceeds
                               this many pixels; overrides --profile    [number]
      --image-format           Comma-separated target formats
                               (webp,png,jpg,avif,exr,hdr); overrides --profile.
                               Each source converts to the target sharing its
                               dynamic range: SDR sources use the first SDR
                               target, HDR sources (exr/hdr) use the first HDR
                               target. An HDR source with no HDR target
                               requested is linearly clipped to SDR (no tone
                               mapping). Append ":<compression>" to exr (e.g.
                               "exr:piz") to normalize EXR compression;
                               supported: none, rle, zips, zip, piz, pxr24, b44,
                               b44a, dwaa, dwab                         [string]
      --image-quality          Quality for lossy image formats (webp/jpg/avif).
                               Default: 95 for webp/jpg; avif uses
                               mtlx-fidelity's render settings (quality 90,
                               4:4:4 chroma)                            [number]
      --texture-library, --tl  Loose .mtlx output only: copy textures into this
                               directory (relative to --output) instead of
                               ./textures. Ignored for .mtlx.zip output, whose
                               resources remain inside the archive.     [string]

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -o, --output    Output path; a .mtlx/.mtlx.zip path combines every input into
                  one file, a directory converts each input separately (same
                  basename, same format) into that directory [string] [required]
      --verbose   Batch mode: print every file written instead of just a
                  one-line summary                    [boolean] [default: false]
      --dry-run   Transform and validate in memory, report planned files, and
                  create no output                    [boolean] [default: false]
      --format    Output format
                             [choices: "text", "json", "yaml"] [default: "text"]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx upload <file>

Upload a .mtlx.zip (or .mtlx) file as a new material

Positionals:
  file  Path to a .mtlx.zip (or .mtlx) file                  [string] [required]

Options:
      --parallel     Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --name         Material name                           [string] [required]
      --keywords     Keywords                                           [string]
      --user         User name                                          [string]
      --visibility   Material visibility
                             [string] [choices: "PRIVATE", "UNLISTED", "PUBLIC"]
      --license      Share license
             [string] [choices: "NONE", "CC_0", "CC_BY", "CC_BY_SA", "CC_BY_NC",
                                       "CC_BY_NC_SA", "CC_BY_ND", "CC_BY_NC_ND"]
      --description  Description                                        [string]
      --metadata     Metadata as a string (max 10240 characters)        [string]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

```text
mtlx view <input>

Open a local 3D preview of a .mtlx or .mtlx.zip file in your browser

Positionals:
  input  Path to .mtlx or .mtlx.zip file                     [string] [required]

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx assets

assets commands

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx auth

auth commands

Commands:
  mtlx auth login   Authenticate with the MTLX.ai platform
  mtlx auth logout  Clear stored authentication
  mtlx auth status  Show current authentication status
  mtlx auth whoami  Show the current auth type and default user

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx comments

comments commands

Commands:
  mtlx comments create              Create a comment on a material
  mtlx comments delete <commentId>  Delete a comment on a material
  mtlx comments edit <commentId>    Edit a comment on a material
  mtlx comments list                List comments for a material

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx config

config commands

Commands:
  mtlx config clear  Clear default user and/or API host from global config
  mtlx config get    Get current default user and API host
  mtlx config set    Set default user and/or API host

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx health

Check if the API server is healthy and reachable

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --host      API host URL (overrides config)                       [string]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx materials

materials commands

Commands:
  mtlx materials delete [userMaterial]    Delete a material
  mtlx materials download [userMaterial]  Download a material file
  mtlx materials get [userMaterial]       Get material details
  mtlx materials list                     List materials
  mtlx materials update [userMaterial]    Update a material
  mtlx materials upload <file>            Upload a .mtlx.zip (or .mtlx) file as
                                          a new material

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx notifications

notifications commands

Commands:
  mtlx notifications list                   List notifications
  mtlx notifications mark-all-read          Mark all notifications as read
  mtlx notifications mark-read              Mark notification as read
  <notificationId>

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx search <query>

Search public materials (shortcut for `materials list --search`)

Positionals:
  query  Search text                                         [string] [required]

Options:
      --parallel     Number of parallel operations to run concurrently
                                                           [number] [default: 4]
      --page-offset  Page offset for pagination            [number] [default: 0]
      --page-size    Page size for pagination             [number] [default: 20]
  -f, --format       Output format
                     [string] [choices: "json", "yaml", "csv"] [default: "json"]
  -h, --help         Show help                                         [boolean]
  -v, --version      Show version number                               [boolean]
```

```text
mtlx users

users commands

Commands:
  mtlx users get <userName>  Get user details
  mtlx users list            List users

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

```text
mtlx docgen

Write the OpenCLI document to a file, or stdout if --output is omitted

Options:
      --parallel  Number of parallel operations to run concurrently
                                                           [number] [default: 4]
  -o, --output    Output file; defaults to stdout                       [string]
      --format    Output format
                [string] [choices: "json", "yaml", "markdown"] [default: "json"]
  -h, --help      Show help                                            [boolean]
  -v, --version   Show version number                                  [boolean]
```

<!-- end:cli_help -->
