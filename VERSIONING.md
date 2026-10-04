# Documentation versioning

## What is here

| Path | What it is | Built with |
|---|---|---|
| `docs/` | The live 2.0 documentation, published as **2.0.0-preview** | Mintlify (`docs/docs.json`) |
| `archive/site/` | The 1.0 to 1.8 documentation, compiled once and **frozen** | nothing: static HTML (see `archive/README.md`) |
| `examples/2.0.0-preview/` | The Compose file the 2.0 quickstart uses | |
| `examples/1.x.y/` | 1.x examples the archive links to | frozen |
| `content/`, `layouts/`, `hugo.toml`, … | The Hugo source the archive was built from | removed at cutover (below) |

## Working on 2.0 pages

```sh
cd docs
npx mint dev            # local preview on :3000
npx mint broken-links   # before every change
```

Every page states it describes the 2.0.0-preview. Image tags are the preview
build (`ghcr.io/myuptime-info/uptimer:2.0.0-rc1`); when the release
candidate's tag changes, replace it in `docs/` and `examples/2.0.0-preview/`.
Never `:latest`.

## `/latest/`

`/latest/` stays on 1.8.0 (in the archive) until Uptimer 2.0 is released. The
2.0 release moves it: remove the `/latest` redirects from `docs/docs.json` and
drop the preview label, banner and `-rc` tags.

## Cutover to Mintlify (one time)

1. Serve `archive/site/` from a static host at `https://archive.uptimer.myuptime.info`.
2. Connect the Mintlify project to this repository with `docs/` as the docs
   directory, and point `uptimer.myuptime.info` at Mintlify.
3. Check that `/latest/…` and `/v1.x.y/…` redirect into the archive and that
   `/mcp` answers.
4. Remove the Hugo source (`content/`, `layouts/`, `assets/`, `i18n/`,
   `archetypes/`, `static/`, `hugo.toml`) and the old Hugo deploy.
