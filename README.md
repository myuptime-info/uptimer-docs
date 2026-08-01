# Uptimer documentation

Public documentation for self-hosted [Uptimer](https://uptimer.myuptime.info),
developer-friendly website monitoring software. The site is built with Hugo.


## Resources

- [Hosted Uptimer](https://myuptime.info)
- [Online documentation](https://uptimer.myuptime.info)
- [Container image](https://github.com/users/myuptime-info/packages/container/package/uptimer) — `ghcr.io/myuptime-info/uptimer`
- [Python SDK](https://github.com/myuptime-info/uptimer-python-sdk)
- [Product updates](https://myuptime.info/product-updates)
- [Public roadmap](https://github.com/users/myuptime-info/projects/2)
- [Documentation issues](https://github.com/myuptime-info/uptimer-docs/issues)


## Versions

The site keeps versioned documentation. `/latest/` redirects to the newest
published stable version.

## Local Development

To run the documentation site locally:

```bash
hugo server -D -p 1314
```

This will start a local server at http://127.0.0.1:1314/, where you can preview the documentation.

## Building

To build the static site:

```bash
hugo --gc --minify
```

This will generate the static site in the `public/` directory.

## Contributing

When making changes to the documentation:

1. Keep each version accurate for the matching Uptimer release.
2. Use appropriate front matter in each content file.
3. Build the site before submitting the change.
