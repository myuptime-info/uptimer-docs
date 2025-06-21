# MyUptime Self-Hosted Documentation

This repository contains the documentation for MyUptime Self-Hosted, a powerful solution for monitoring websites and services. The documentation is built using Hugo with the hugo-book theme.

## Local Development

To run the documentation site locally:

```bash
# Install Hugo (if not already installed)
# See https://gohugo.io/installation/ for platform-specific instructions

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

## GitHub Pages Deployment

This repository is configured to automatically deploy to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Update Configuration**:
   - In `hugo.toml`, replace the placeholder values:
     - Change `baseURL = 'https://GITHUB_USERNAME.github.io/REPO_NAME/'` to your actual GitHub Pages URL
     - Update the GitHub repository URL in the menu: `url = "https://github.com/GITHUB_USERNAME/REPO_NAME"`

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Under "Source", select "GitHub Actions"

3. **Push Changes**:
   - Commit and push your changes to the main branch
   - The GitHub Actions workflow will automatically build and deploy your site

4. **Verify Deployment**:
   - Check the Actions tab in your GitHub repository to monitor the deployment
   - Once complete, your site will be available at your GitHub Pages URL

### How It Works

The deployment uses a GitHub Actions workflow defined in `.github/workflows/hugo.yml`. This workflow:

1. Installs Hugo and dependencies
2. Builds the Hugo site
3. Deploys the built site to GitHub Pages

The workflow runs automatically when changes are pushed to the main branch, or it can be triggered manually from the Actions tab.

## Project Structure

- `content/`: Contains all the documentation content organized in sections
- `themes/`: Contains the Hugo themes used by the project
- `hugo.toml`: Main configuration file for the Hugo site
- `public/`: Generated static site (after building)
- `.github/workflows/`: Contains GitHub Actions workflow files

## Validating GitHub Actions Locally

You can validate and test GitHub Actions workflows locally before pushing changes to the repository. This helps catch issues early and speeds up development.

### Using Act

[Act](https://github.com/nektos/act) is a tool that allows you to run GitHub Actions locally using Docker.

#### Installation

```bash
# macOS (using Homebrew)
brew install act

# Linux
curl -s https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Windows (using Chocolatey)
choco install act-cli
```

#### Usage

To list all available actions in your workflows:
```bash
act -l
```

To run the entire workflow:
```bash
act
```

To run a specific job (e.g., the build job):
```bash
act -j build
```

If you're using an Apple M-series chip (ARM architecture), you'll need to specify the container architecture:
```bash
act -j build --container-architecture linux/amd64
```

### Testing GitHub Pages Deployment Locally

When testing GitHub Actions workflows locally with `act`, you may encounter errors related to GitHub Pages deployment:

```
::error::Get Pages site failed. Please verify that the repository has Pages enabled and configured to build using GitHub Actions
::error::Error: Parameter token or opts.auth is required
```

This happens because:
1. The GitHub Pages configuration requires the repository to have GitHub Pages enabled
2. The deployment process requires authentication tokens that aren't available in local testing

To test the build process without these errors, use the provided local testing workflow:

```bash
# Run the local testing workflow
act -j build -W .github/workflows/hugo-local-test.yml --container-architecture linux/amd64
```

This workflow skips the GitHub Pages configuration and deployment steps, focusing only on validating that the Hugo build process works correctly.

To run a workflow with a specific event (e.g., push):
```bash
act push
```

### Using Actionlint

[Actionlint](https://github.com/rhysd/actionlint) is a static checker for GitHub Actions workflow files.

#### Installation

```bash
# macOS (using Homebrew)
brew install actionlint

# Using Go
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# Using npm
npm install -g actionlint
```

#### Usage

To check all workflow files:
```bash
actionlint
```

To check a specific workflow file:
```bash
actionlint .github/workflows/hugo.yml
```

### Using the Validation Script

For convenience, a validation script is included in the repository that checks for the presence of the required tools and runs basic validation:

```bash
# Run the validation script
./validate_workflow.sh
```

This script will:
1. Check if actionlint is installed and run it on all workflow files
2. Check if act is installed and list available actions
3. Detect if you're running on Apple Silicon and provide the appropriate command
4. Provide guidance on how to test the build process without GitHub Pages deployment

The script automatically detects your system architecture and provides the correct command to run the local testing workflow:

```bash
# For Apple Silicon (ARM64) users:
act -j build -W .github/workflows/hugo-local-test.yml --container-architecture linux/amd64

# For other architectures:
act -j build -W .github/workflows/hugo-local-test.yml
```

## Contributing

When making changes to the documentation:
1. Ensure all Markdown files follow proper formatting
2. Use appropriate front matter in each content file (title, weight, etc.)
3. Test changes locally before committing
4. Submit a pull request for review
