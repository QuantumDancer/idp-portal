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

Endpoint: `http://localhost:7007/api/mcp-actions/v1` (local) or `https://<your-backstage-host>/api/mcp-actions/v1` (production).

For Claude Code, add the following to `~/.claude.json`:

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
