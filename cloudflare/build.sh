#!/usr/bin/env bash
# Builds www.briannaimm.com for Cloudflare Workers. Workers Builds runs this file.
# GitHub Pages does not use it; GitHub builds the site on its own.
set -euo pipefail
cd "$(dirname "$0")/.."
export BUNDLE_PATH=vendor/bundle
# Gemfile.lock lists only macOS. Add Linux here, on the build machine only; the committed file stays as it is.
bundle lock --add-platform x86_64-linux
bundle install --jobs 4 --retry 3
JEKYLL_ENV=production bundle exec jekyll build --destination _site
echo "Built _site/ with $(find _site -type f | wc -l | tr -d ' ') files."
