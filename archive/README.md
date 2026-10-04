# Frozen 1.x documentation archive

`site/` is the compiled Hugo site for Uptimer 1.0 to 1.8, built once on
2026-10-04 from commit `ba36c20` ("docs: promote 1.8.0 to latest") with Hugo
v0.164.0 (`hugo --gc --minify -d archive/site`).

**It is frozen.** Do not rebuild it and do not edit it for 2.0 changes. It is
static HTML: serve `site/` as is from a static host. Its `_redirects` keeps
`/latest/` on 1.8.0 and sends `/vX.Y.Z/examples` links to the `examples/`
folders in this repository.

The 2.0 site (`docs/`, Mintlify) redirects `/latest/*` and `/v1.x.y/*` to this
archive's host. See `VERSIONING.md`.
