#!/bin/bash

# List of files to process
files="404.html about.html join.html terms.html privacy.html login.html sign_up.html"

for file in $files; do
    echo "Fixing paths in $file..."
    # Remove leading slashes from resource paths
    sed -i 's|href="/css|href="css|g' "$file"
    sed -i 's|href="/node_modules|href="node_modules|g' "$file"
    sed -i 's|src="/js|src="js|g' "$file"
    sed -i 's|src="/socket.io|src="socket.io|g' "$file"
    sed -i 's|from "/js|from "js|g' "$file"
done

echo "Done fixing paths!"
