#!/usr/bin/env bash
set -e
hugo
npx pagefind --site public
echo "Build complete. Upload ./public to Hostinger."
