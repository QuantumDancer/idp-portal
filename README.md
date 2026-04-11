# IDP Portal

## Local development

```sh
source .env
docker compose up -d -f docker-compose.local.yaml
yarn install
yarn start
```

## MCP server

Backstage exposes a [Model Context Protocol](https://modelcontextprotocol.io) server at `/api/mcp-actions/v1`.
AI coding assistants (Claude Code, Cursor, etc.) can connect to it and invoke Backstage catalog and scaffolder actions as MCP tools.

### Authentication

The MCP server uses OAuth Dynamic Client Registration.
When an AI client connects for the first time, a browser window opens prompting you to log in via your normal Backstage/GitLab SSO.
Once authenticated, all MCP tool calls run as your user, using the same permissions and audit trail as the web UI.
Tokens expire after one hour, after which the OAuth flow repeats.

### Connecting an AI client

#### Local development

When working inside this repository, the MCP server is pre-configured via `.mcp.json` at the repo root.
Claude Code picks this up automatically, no manual setup is needed.
The local server is available at `http://localhost:7007/api/mcp-actions/v1` (requires `yarn start` to be running).

#### Production

To connect Claude Code to the production IDP portal permanently, add the following to your global `~/.claude.json`:

```json
{
  "mcpServers": {
    "idp-portal": {
      "type": "http",
      "url": "https://<your-backstage-host>/api/mcp-actions/v1"
    }
  }
}
```

This makes the IDP portal available as an MCP tool in all your Claude Code sessions, not just within this repository.
Other AI clients (Cursor, etc.) support similar per-user config files. Consult their documentation for the equivalent setting.
