# mtlx

Cloud command reference for the unified `mtlx` CLI, which talks to [Land of Assets](https://landofassets.com). The installed package is `mtlx-cli`; it also provides the `mtlx-ai` binary for existing scripts.

## Installation

```bash
npm i -g mtlx-cli
# or
pnpm add -g mtlx-cli
# or
yarn global add mtlx-cli
```

## Quick Start

```bash
# Authenticate with your account
mtlx auth login

# Remember your org and project so you can omit --org/--project from most commands
mtlx config set --org my-org --project my-project

# Upload a material
mtlx materials upload copper.mtlx.zip --name copper --visibility PUBLIC

# List your materials
mtlx materials list

# Search all public materials
mtlx search copper
```

> **Tip**: Use `mtlx <command> --help` or `mtlx <category> --help` to see available commands and their descriptions. For example, `mtlx auth --help` or `mtlx materials --help`.

## Commands

### Authentication

```bash
mtlx auth login          # Log in to your account (opens browser)
mtlx auth logout         # Log out and clear credentials
mtlx auth status         # Show current authentication status
mtlx auth whoami         # Show auth type and configured default org/project
```

### Configuration

```bash
mtlx config set [--org <org>] [--project <project>] [--host <url>]   # Set default org, project, and/or API host
mtlx config get                                                      # Get current configuration
mtlx config clear [--org] [--project] [--host]                       # Clear configuration
```

### Materials

Materials are Land of Assets `MATERIAL` assets, uploaded as a `.mtlx.zip` (or loose `.mtlx`) file.
They live in a project within an organization, addressed as `<org>/<project>/<name>` (e.g.
`acme/library/copper`). Listing and search only return `MATERIAL` assets.

```bash
mtlx materials list [--org <org>] [--project <project>] [--search <text>] [--visibility <v>]   # List materials
mtlx materials get <org>/<project>/<name>                                 # Get material details
mtlx materials upload <file.mtlx.zip> --name <name> [--org <org>] [--project <project>]   # Upload a new material
  [--description <text>] [--keywords <text>] [--visibility <v>] [--license <l>]
mtlx materials download <org>/<project>/<name> [-o <path>]                # Download the material file
mtlx materials update <org>/<project>/<name> [--new-name <name>] [--description <text>]
  [--keywords <text>] [--visibility <v>] [--license <l>]                     # Update a material
mtlx materials delete <org>/<project>/<name>                              # Delete a material
```

`get`, `download`, `update`, and `delete` also accept a bare `<name>` or `--name <name>`, taking the
org and project from `--org`/`--project` (or the configured defaults). `mtlx assets ...` is kept as a hidden alias of
`mtlx materials ...` for continuity with earlier versions of this CLI.

### Search

```bash
mtlx search <query>   # Shortcut for `materials list --search <query>`
```

### API Tokens

```bash
mtlx api-tokens list [--org <org>] [--project <project>]                   # List API tokens
mtlx api-tokens create <serviceAccount> <name> --type <SECRET|FRONTEND> [--org <org>] [--project <project>]
                                                                           # Create a service account API token
mtlx api-tokens delete <name> [--org <org>] [--project <project>]          # Delete an API token
```

### Comments

```bash
mtlx comments list --asset <name> [--org <org>] [--project <project>]                       # List comments on a material
mtlx comments create --asset <name> --text <text> [--org <org>] [--project <project>]       # Create a comment
mtlx comments edit <commentId> --asset <name> --text <text> [--org <org>] [--project <project>]   # Edit a comment
mtlx comments delete <commentId> --asset <name> [--org <org>] [--project <project>]         # Delete a comment
```

### Users

```bash
mtlx users get <user>       # Get user details
mtlx users list             # List users (requires user session auth)
```

### Notifications

```bash
mtlx notifications list             # List notifications
mtlx notifications mark-read <id>   # Mark notification as read
mtlx notifications mark-all-read    # Mark all notifications as read
```

### Health Check

```bash
mtlx health                 # Check API health status
```

## Configuration

The CLI stores configuration in `~/.config/mtlx/config.json`. Available settings:

- `host` - API base URL (default: `https://api.landofassets.com`, typically doesn't need to be set)
- `org` - Default organization, used when `--org` is omitted from other commands
- `project` - Default project, used when `--project` is omitted from other commands

### Default Org and Project

Set them once so you can omit `--org`/`--project` from most commands:

```bash
mtlx config set --org my-org --project my-project
```

```bash
# Without defaults set
mtlx materials list --org my-org --project my-project

# With defaults set
mtlx materials list
```

To clear them, run `mtlx config clear --org` (which also clears the project).

## Environment Variables

- `LOA_HOST` - Override the API host
- `LOA_TOKEN` - Provide an API token for authentication

## Requirements

- Node.js >= 23.0.0

## License

MIT
