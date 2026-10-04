// Docs search for AI tools: a Model Context Protocol server at /mcp (#247).
//
// A Cloudflare Pages Function on the same site as the Hugo docs. It reads the
// site's own search index (/index.json) and answers MCP over Streamable HTTP,
// statelessly: every POST carries one JSON-RPC message and gets one JSON answer.
// It searches the v2.0.0-preview pages only and has no other tool: it never
// reaches an Uptimer installation.

const VERSION = '2.0.0-preview';
const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const MAX_RESULTS = 10;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};

const TOOLS = [
  {
    name: 'search_docs',
    title: 'Search the Uptimer 2.0 preview docs',
    description:
      'Search the Uptimer v2.0.0-preview documentation (self-hosted 2.0: install, workers, ' +
      'PostgreSQL, sign-in, logging, API v3, Python SDK, MCP). Returns page titles, URLs and snippets.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to look for, in plain words.' },
        limit: { type: 'integer', minimum: 1, maximum: MAX_RESULTS, description: 'At most 10. Default 5.' },
      },
      required: ['query'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'read_doc',
    title: 'Read an Uptimer 2.0 preview docs page',
    description: 'The text of one v2.0.0-preview page, by the URL or path search_docs returned.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'A /v2.0.0-preview/… path or its full URL.' } },
      required: ['url'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

let pages = null; // the preview entries of /index.json, read once per isolate

async function preview(env, request) {
  if (pages) return pages;
  const response = await env.ASSETS.fetch(new URL('/index.json', request.url));
  if (!response.ok) throw new Error(`the search index answered ${response.status}`);
  pages = (await response.json()).filter((page) => page.version === VERSION);
  return pages;
}

function words(text) {
  return (text || '').toLowerCase().match(/[a-z0-9][a-z0-9._-]*/g) || [];
}

function count(haystack, needle) {
  let n = 0;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + needle.length)) n++;
  return n;
}

function snippet(text, terms) {
  const lower = text.toLowerCase();
  const at = Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0), text.length);
  const start = Math.max(0, at - 80);
  return (start > 0 ? '…' : '') + text.slice(start, start + 280).replace(/\s+/g, ' ').trim() + '…';
}

function search(all, query, limit, base) {
  const terms = [...new Set(words(query))];
  if (terms.length === 0) return [];
  return all
    .map((page) => {
      const title = page.title.toLowerCase();
      const lede = (page.lede || '').toLowerCase();
      const text = (page.text || '').toLowerCase();
      let score = 0;
      for (const term of terms) {
        score += 6 * count(title, term) + 3 * count(lede, term) + Math.min(count(text, term), 10);
      }
      return { page, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ page }) => ({
      title: page.title,
      section: page.section,
      url: new URL(page.url, base).toString(),
      snippet: snippet(page.text || page.lede || '', terms),
    }));
}

function result(id, value) {
  return { jsonrpc: '2.0', id, result: value };
}

function failure(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function toolAnswer(value, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, isError };
}

async function call(name, args, env, request) {
  const all = await preview(env, request);
  if (name === 'search_docs') {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) return toolAnswer({ error: 'Give a query.' }, true);
    const limit = Number.isInteger(args.limit) ? Math.min(Math.max(args.limit, 1), MAX_RESULTS) : 5;
    return toolAnswer({ results: search(all, query, limit, request.url) });
  }
  // read_doc
  let path = typeof args.url === 'string' ? args.url.trim() : '';
  try {
    path = new URL(path, request.url).pathname;
  } catch {
    path = '';
  }
  if (!path.endsWith('/')) path += '/';
  const page = all.find((p) => p.url === path);
  if (!page) return toolAnswer({ error: `No v${VERSION} page at ${path}. Use search_docs to find one.` }, true);
  return toolAnswer({
    title: page.title,
    url: new URL(page.url, request.url).toString(),
    section: page.section,
    text: page.text,
    note: 'The text is the page as plain words, about the first 4000 characters; open the URL for all of it.',
  });
}

async function answer(message, env, request) {
  const { id, method, params } = message;
  switch (method) {
    case 'initialize': {
      const asked = params && params.protocolVersion;
      return result(id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'uptimer-docs', title: 'Uptimer docs', version: VERSION },
        instructions:
          'Searches the Uptimer v2.0.0-preview documentation only. It cannot reach or change any Uptimer installation.',
      });
    }
    case 'ping':
      return result(id, {});
    case 'tools/list':
      return result(id, { tools: TOOLS });
    case 'tools/call': {
      const name = params && params.name;
      if (!TOOLS.some((tool) => tool.name === name)) return failure(id, -32602, `Unknown tool: ${name}`);
      return result(id, await call(name, (params && params.arguments) || {}, env, request));
    }
    default:
      return failure(id, -32601, `Method not found: ${method}`);
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') {
    // No server-to-client stream: this server only answers requests.
    return new Response('This is an MCP endpoint: POST JSON-RPC messages to it.', {
      status: 405,
      headers: { Allow: 'POST, OPTIONS', ...CORS },
    });
  }
  let message;
  try {
    message = await request.json();
  } catch {
    return json(failure(null, -32700, 'Parse error'), 400);
  }
  if (Array.isArray(message) || typeof message !== 'object' || message === null) {
    return json(failure(null, -32600, 'Send one JSON-RPC message per request.'), 400);
  }
  // A notification or a response from the client: accepted, nothing to answer.
  if (message.id === undefined || message.method === undefined) {
    return new Response(null, { status: 202, headers: CORS });
  }
  try {
    return json(await answer(message, env, request));
  } catch (err) {
    return json(failure(message.id, -32603, `The docs index could not be read: ${err.message}`), 500);
  }
}
