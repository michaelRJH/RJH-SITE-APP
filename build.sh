#!/bin/sh
# Rebuild the app: index.html and sw.js from the files in src/
set -e
cd "$(dirname "$0")/src"
python3 splice52.py
V=$(cat VERSION)
cp v52.html ../index.html && rm v52.html
sed -i "s/const CACHE='rjh-site-app-v[0-9]*'/const CACHE='rjh-site-app-$V'/" ../sw.js
echo "index.html rebuilt as $V"
