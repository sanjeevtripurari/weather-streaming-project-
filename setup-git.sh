#!/bin/bash

# Git setup script for cross-platform development (Windows/Linux)
echo "Setting up Git configuration for cross-platform development..."

# Configure line ending handling
echo "Configuring line endings..."
git config core.autocrlf false
git config core.eol lf
git config core.safecrlf true

# Configure Git to handle file permissions properly
echo "Configuring file permissions..."
git config core.filemode false

# Configure Git to handle case sensitivity
echo "Configuring case sensitivity..."
git config core.ignorecase false

# Configure Git editor (optional)
echo "Configuring default editor..."
git config core.editor "code --wait" 2>/dev/null || echo "VS Code not found, skipping editor config"

# Configure push behavior
echo "Configuring push behavior..."
git config push.default simple

# Configure pull behavior
echo "Configuring pull behavior..."
git config pull.rebase false

# Show current configuration
echo ""
echo "Current Git configuration:"
echo "========================="
git config --list | grep -E "(core\.|push\.|pull\.)" | sort

echo ""
echo "Git setup complete!"
echo ""
echo "To apply line ending fixes to existing files, run:"
echo "  git add --renormalize ."
echo "  git commit -m 'Normalize line endings'"
echo ""
echo "For Windows users, also run:"
echo "  git config --global core.autocrlf false"
echo "  git config --global core.eol lf"