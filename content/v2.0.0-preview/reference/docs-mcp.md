---
title: "Docs search for AI tools (MCP)"
weight: 40
lede: "Search these 2.0 preview pages from an AI assistant through the MCP endpoint at /mcp."
---

This site serves a Model Context Protocol (MCP) server at `https://uptimer.myuptime.info/mcp`.
An AI assistant connected to it can search the v2.0.0-preview pages and read them. It is
documentation only: it cannot reach or change any Uptimer installation. To let an AI tool use
your installation, see [MCP (installed binary)](/v2.0.0-preview/reference/mcp/).

## Connect

```json
{
  "mcpServers": {
    "uptimer-docs": {
      "type": "http",
      "url": "https://uptimer.myuptime.info/mcp"
    }
  }
}
```

Claude Code:

```bash
claude mcp add --transport http uptimer-docs https://uptimer.myuptime.info/mcp
```

MCP Inspector:

```bash
npx -y @modelcontextprotocol/inspector --cli https://uptimer.myuptime.info/mcp \
  --transport http --method tools/call --tool-name search_docs --tool-arg query="rotate a worker certificate"
```

No sign-in and no key: the pages are public.

## Tools

| Tool | What it does |
|---|---|
| `search_docs` | Search the v2.0.0-preview pages: `query`, and `limit` (1–10, default 5). Returns titles, URLs and snippets. |
| `read_doc` | The text of one page, by the URL `search_docs` returned. |

It covers only the v2.0.0-preview pages. The 1.x documentation is at [/latest/](/latest/).
