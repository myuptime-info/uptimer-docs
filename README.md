# MyUptime Self-Hosted Documentation

This repository contains the documentation for MyUptime Self-Hosted, a powerful solution for monitoring websites and services. The documentation is built using Hugo with the hugo-book theme.

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

## Deployment

This repository is configured to be deployed to Cloudflare Pages.

### Setup Instructions

1. **Update Configuration**:
   - In `hugo.toml`, the baseURL is set to `https://uptimer.myuptime.info/`
   - The GitHub repository URL in the menu is set to `https://github.com/myuptime-info/uptimer`

2. **Deploy to Cloudflare Pages**:
   - Connect your Cloudflare account to your GitHub repository
   - Configure the build settings in Cloudflare Pages
   - Set the build command to `hugo`
   - Set the build directory to `public`

3. **Verify Deployment**:
   - Once complete, your site will be available at https://uptimer.myuptime.info

## Project Structure

- `content/`: Contains all the documentation content organized in sections
- `themes/`: Contains the Hugo themes used by the project
- `static/`: Contains static files that will be copied directly to the output directory
- `hugo.toml`: Main configuration file for the Hugo site
- `public/`: Generated static site (after building)


## Contributing

When making changes to the documentation:
1. Ensure all Markdown files follow proper formatting
2. Use appropriate front matter in each content file (title, weight, etc.)
3. Test changes locally before committing
4. Submit a pull request for review
