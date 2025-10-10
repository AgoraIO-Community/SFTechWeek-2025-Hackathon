# @principal/core

Core library for Principal AI - GitHub repository parsing and LLM services for the hackathon.

## Features

- **GitHub Repository Loading**: Fetch and cache repository contents via GitHub API
- **MemoryPalace Integration**: Access codebase views, notes, and guidance from `.alexandria/` directories
- **Groq LLM Integration**: Ultra-fast LLM inference for intelligent responses

## Setup

1. Install dependencies:
```bash
bun install
```

2. Set your GitHub token (for API access):
```bash
export GITHUB_TOKEN=your_github_token_here
```

## Demo

Run the demo to see MemoryPalace loading a GitHub repository:

```bash
bun run src/demo.ts
```

## Architecture

### Adapters

- **GitHubFileSystemAdapter**: Pre-fetches repository files and implements MemoryPalace's `FileSystemAdapter` interface
- **GitHubGlobAdapter**: Fetches file trees from GitHub and implements glob pattern matching

### How It Works

1. **Pre-fetch**: Downloads `.alexandria/` directory structure from GitHub
2. **Cache**: Stores files in memory to support synchronous file operations
3. **MemoryPalace**: Uses cached files to read views, notes, and guidance
4. **LLM Context**: Sends structured context to Groq for intelligent responses

## Next Steps

- Integrate with Groq LLM for Q&A
- Connect to voice interface (Agora/ElevenLabs/HeyGen)
- Deploy to Appwrite
