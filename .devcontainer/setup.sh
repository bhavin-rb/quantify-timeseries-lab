#!/usr/bin/env bash
# Devcontainer setup: everything the agents need to build and test Personal Space.
set -euo pipefail

echo "Installing OpenCode and agent-browser..."
npm install -g opencode-ai agent-browser skills

echo "Installing Chromium..."
sudo apt-get update
sudo apt-get install -y chromium

echo "Adding the agent-browser skill for OpenCode..."
npx -y skills add vercel-labs/agent-browser -a opencode -y

echo "Verifying the installs..."
opencode --version
agent-browser --help
skills list

echo "✅ Setup complete."




