# Documentation versioning

The docs site keeps one content tree per documented release under `content/vX.Y.Z/`, plus a
stable `/latest/` alias. The theme (Pico.css + `tokens.css` + the B2 layout in `layouts/`,
per ADR-0001/0002) is version-agnostic — it derives the nav, breadcrumbs and pager from whatever
version subtree a page lives in.

## Structure

```
content/
├── _index.md            # root → redirects to the default version
├── v1.3.0/              # current (default + latest)
│   ├── _index.md        # version landing (section cards)
│   ├── getting-started/ · core-concepts/ · alerting/ · operating/ · reference/
│   └── …                # each section has _index.md (weight) + pages (weight)
└── v1.0.0/              # frozen archive
```

The left-nav groups are a version's sub-sections (ordered by `weight`); pages within a group are
ordered by their `weight`. Front matter used by the theme: `title`, `weight`, and `lede`
(the one-line intro under the H1).

## `/latest/` links

`/latest/…` always points at the current release, so external links survive version bumps. It is
served by `static/_redirects` (Cloudflare Pages / Netlify splat syntax):

```
/latest/*  /v1.3.0/:splat  301
/latest    /v1.3.0/        301
```

Link to `/latest/getting-started/quick-start/` from outside the site; **inside** the site use
version-absolute links (`/v1.3.0/…`), as the pages do. If the site moves to a host that doesn't
read `_redirects`, configure the same rule there.

## Adding a new version

1. **Copy the current tree:** `cp -r content/v1.3.0 content/v1.4.0`
2. **Update `hugo.toml`** `[params.versions]` — set `default` + `latest` to the new version and
   prepend it to `available` (newest first).
3. **Update `static/_redirects`** — point `/latest/*` **and** the `/v1.3.0/examples*` +
   `/latest/examples*` rules at the new version.
4. **Update `content/_index.md`** — set the root redirect `url` to the new version.
5. **Rewrite the in-tree links** in the new folder to the new version prefix
   (`/v1.3.0/` → `/v1.4.0/`) and update the content for what changed.

The version pill (`layouts/partials/version-selector.html`) and the outdated-version banner
(`layouts/partials/version-banner.html`) update automatically from `[params.versions]` — no
hard-coded version strings in templates.

## The container image tag

Docs never reference `:latest` — every `docker` example pins the exact version via the
`{{</* image */>}}` shortcode (`layouts/shortcodes/image.html`), which emits
`ghcr.io/myuptime-info/uptimer:X.Y.Z` where `X.Y.Z` is **derived from the content tree the page
lives in**. So copying `content/v1.3.0` → `content/v1.4.0` updates every image reference with no
edits. Author image commands as:

```
docker run -p 2517:2517 {{</* image */>}}
```

## Build

```sh
hugo server -D          # local preview
hugo --gc --minify      # production build → public/
```
