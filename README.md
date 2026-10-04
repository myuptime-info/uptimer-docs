# Uptimer documentation

Public documentation for self-hosted [Uptimer](https://uptimer.myuptime.info).
The 2.0 documentation (`docs/`) is built with Mintlify and published as
**2.0.0-preview**. The 1.x documentation is a frozen, compiled archive in
`archive/site/`. See `VERSIONING.md`.


## Resources

- [Hosted Uptimer](https://myuptime.info)
- [Online documentation](https://uptimer.myuptime.info)
- [Container image](https://github.com/users/myuptime-info/packages/container/package/uptimer) — `ghcr.io/myuptime-info/uptimer`
- [Python SDK](https://github.com/myuptime-info/uptimer-python-sdk)
- [Product updates](https://myuptime.info/product-updates)
- [Public roadmap](https://github.com/users/myuptime-info/projects/2)
- [Documentation issues](https://github.com/myuptime-info/uptimer-docs/issues)


## Local development

```bash
cd docs
npx mint dev
npx mint broken-links
```

## Contributing

When making changes to the documentation:

1. Keep each version accurate for the matching Uptimer release.
2. Use appropriate front matter in each content file.
3. Run `npx mint broken-links` in `docs/` before submitting the change.
