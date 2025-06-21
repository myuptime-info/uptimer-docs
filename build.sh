#!/bin/bash

# Build script for Hugo site on Netlify

# Exit on any error
set -e

# Install Hugo if not already installed
if ! command -v hugo &> /dev/null; then
    echo "Installing Hugo..."
    # This will be handled by Netlify's build environment
    # which has Hugo pre-installed
fi

# Build the site
echo "Building Hugo site..."
hugo --gc --minify

echo "Build completed successfully!" 