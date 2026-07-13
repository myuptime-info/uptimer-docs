# AGENTS.md — uptimer-docs

The **public** documentation site for OSS **uptimer**, served at <https://uptimer.myuptime.info>.
Hugo, no external theme. Read this before editing; it's the design + content contract for the
site. Fleet-wide rules still apply (see the workspace `AGENTS.md`): trunk-based on `main`, no
agent attribution, Commitizen subjects.

Build: `hugo --gc --minify` (toolchain via `ai-fleet-meta/setup.sh --tools`).

## 1. Design

The look is fixed by fleet **ADR-0001** (“B2” direction) and **ADR-0002** (tooling). Don't
re-theme; carry the tokens.

- **Stack:** Pico.css v2 **classless** base (CDN) + **`assets/css/tokens.css`** (the shared brand
  tokens — ink `#161a21`, accent indigo `#4f46e5`, status up/degraded/down; mapped onto
  `--pico-*`) + **`assets/css/docs.css`** (the thin per-surface layer: 3-pane shell, section nav,
  on-page ToC, callouts, code, pager). Layouts live in `./layouts` (no theme).
- **Light-first:** `<html data-theme="light">` is pinned — do not remove it, or Pico follows the
  OS dark preference and inverts everything.
- **Pico gotchas** (they bite): `<nav>`, `nav ul`, `nav li` are flex/inline — any *vertical* nav
  or a menu inside the header nav needs an explicit `display:block` override; `<summary>` gets a
  `::after` chevron (kill it if you add your own); inputs carry a bottom margin and native
  metrics (reset for header controls). **Always verify rendering in a real browser, in both
  colour schemes** — grepping the built HTML won't catch CSS-cascade bugs. Headless Chromium:
  `npx playwright@1.49 screenshot --color-scheme=dark <url> out.png`.
- **Tone:** clean, developer-first, dense. No emoji, no marketing filler.

## 2. Content — how the docs read

Short, and focused on getting a developer running fast, then going deeper.

- **Lead with the try.** The landing and Quick start open with “run this → get this” (a
  one-command `docker run`, the result, a real API call), *then* explain, *then* link deeper.
- **The spine is a story: dev → production, step by step.** `getting-started/self-hosting` walks
  dev → persist a volume → PostgreSQL → OIDC → split services, and each `operating/*` guide adds
  the settings. **Every step is a complete, runnable `docker-compose` plus the reason for it** —
  examples are how devs learn; don't drop them for brevity.
- **Concept pages stay short** (`core-concepts/*`): explain the idea, no API-model/JSON/curl
  dumps. Request/response schemas live only in `reference/rest-api`.
- **Document only what ships.** Verify against the code or a running image; never invent
  features. The current facts to respect:
  - Image `ghcr.io/myuptime-info/uptimer` (public). The **source repo is private — never link
    it** (`/tree`, `/releases`, …). Link the package page or `myuptime.info` instead.
  - REST API is on **`2517/api`** and **needs a Bearer token** (create in the dashboard); always
    HTTP 200 + `{result, error, meta}`.
  - OIDC callback is `/ui/auth/oauth/callback`; gRPC examples use `50051`; checks are HTTP(S)
    only (no assertion language); alerts are one Slack-compatible webhook per workspace.
- **Pin the version with the `{{</* image */>}}` shortcode** in every `docker` example — it emits
  `ghcr.io/myuptime-info/uptimer:X.Y.Z` from the content tree. Never `:latest`.

## 3. Structure, versioning, examples

- **IA** (per B2): Getting started · Core concepts · Alerting · Operating · Reference.
- **Versioned trees** `content/vX.Y.Z/`; `/latest/` is served by `static/_redirects`. Adding a
  version = copy the tree, bump `hugo.toml [params.versions]` + `_redirects`. See `VERSIONING.md`.
- **Runnable examples** live in `examples/X.Y.Z/` (validated with `docker compose config`, and at
  least one smoke-tested). Guides link them. Keep them current with the docs.
- Templates hard-code **no version strings** — the pill, banner and image tag all derive from
  params or the tree.
