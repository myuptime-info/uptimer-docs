# Uptimer Documentation

Repository for the [Uptimer documentation](https://uptimer.myuptime.info)

This repository contains the documentation for Uptimer - Self-Hosted, a powerful solution for monitoring websites and services.

The documentation is built using Hugo with the hugo-book theme.


## Resources

* [Issues](https://github.com/myuptime-info/myuptime-self-hosted-docs/issues)
* [Online documentation](https://uptimer.myuptime.info)
* [Public roadmap](https://muuptime.youtrack.cloud/agiles/183-2/current)
* [Docker image](https://hub.docker.com/r/myuptime/uptimer)


## Notes

Documentation covers only latest version 

## Local Development

To run the documentation site locally:

```bash
# Install Hugo (if not already installed)
# See https://gohugo.io/installation/ for platform-specific instructions
# Note: The hugo-book theme requires Hugo version 0.147.7 or higher

# Start the Hugo server
hugo server -D -p 1314
```

This will start a local server at http://127.0.0.1:1314/, where you can preview the documentation.

## Building

To build the static site:

```bash
hugo
```

This will generate the static site in the `public/` directory.

## Contributing

When making changes to the documentation:
1. Ensure all Markdown files follow proper formatting
2. Use appropriate front matter in each content file (title, weight, etc.)
3. Test changes locally before committing
4. Submit a pull request for review
