# mtlx

Cloud command reference for the unified `mtlx` CLI. The installed package is `mtlx-cli`; it also provides the `mtlx-ai` binary for existing scripts.

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

# Remember your username so you can omit --user from most commands
mtlx config set --user my-user

# Upload a material
mtlx materials upload copper.mtlx.zip --name copper --visibility PUBLIC

# List your materials
mtlx materials list --user my-user

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
mtlx auth whoami         # Show auth type and configured default user
```

### Configuration

```bash
mtlx config set --user <user> [--host <url>]   # Set default user and/or API host
mtlx config get                                # Get current configuration
mtlx config clear [--user] [--host]             # Clear configuration
```

### Materials

Every asset on MTLX.ai is a MaterialX material, uploaded as a `.mtlx.zip` (or loose `.mtlx`)
file. Materials belong directly to a user, addressed as `<user>/<name>` (e.g. `alice/copper`).

```bash
mtlx materials list [--user <user>] [--search <text>] [--visibility <v>]   # List materials
mtlx materials get <user>/<name>                                          # Get material details
mtlx materials upload <file.mtlx.zip> --name <name> [--user <user>]       # Upload a new material
  [--description <text>] [--keywords <text>] [--visibility <v>] [--license <l>]
mtlx materials download <user>/<name> [-o <path>]                         # Download the material file
mtlx materials update <user>/<name> [--new-name <name>] [--description <text>]
  [--keywords <text>] [--visibility <v>] [--license <l>]                     # Update a material
mtlx materials delete <user>/<name>                                       # Delete a material
```

`get`, `download`, `update`, and `delete` also accept `--user <user> --name <name>` instead of
the `<user>/<name>` positional. `mtlx assets ...` is kept as a hidden alias of
`mtlx materials ...` for continuity with earlier versions of this CLI.

### Search

```bash
mtlx search <query>   # Shortcut for `materials list --search <query>`
```

### API Tokens

```bash
mtlx api-tokens list [--user <user>]                                       # List your API tokens
mtlx api-tokens create <name> --type <SECRET|FRONTEND> [--user <user>]     # Create a new API token
mtlx api-tokens delete <name> [--user <user>]                              # Delete an API token
```

### Comments

```bash
mtlx comments list --user <user> --asset <name>                       # List comments on a material
mtlx comments create --user <user> --asset <name> --text <text>       # Create a comment
mtlx comments edit <commentId> --user <user> --asset <name> --text <text>   # Edit a comment
mtlx comments delete <commentId> --user <user> --asset <name>         # Delete a comment
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

The CLI stores configuration in `~/.config/mtlx-ai/config.json` (`.mtlx-ai.json` naming lineage).
Available settings:

- `host` - API base URL (default: `https://api.mtlx.ai`, typically doesn't need to be set)
- `user` - Default user name, used when `--user` is omitted from other commands

### Default User

Set a default user once so you can omit `--user` from most commands:

```bash
mtlx config set --user my-user
```

```bash
# Without a default set
mtlx materials list --user my-user

# With a default set
mtlx materials list
```

To clear it, run `mtlx config clear --user`.

## Environment Variables

- `LOA_HOST` - Override the API host
- `LOA_TOKEN` - Provide an API token for authentication

## Requirements

- Node.js >= 23.0.0

## License

MIT
