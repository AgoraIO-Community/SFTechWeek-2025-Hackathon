# GitHub Codebase View Coverage

This document explains how to calculate codebase view coverage for GitHub repositories.

## What is Codebase View Coverage?

Codebase view coverage measures **what percentage of your source files are documented in Alexandria codebase views**.

**Example:**
- Your repository has 500 TypeScript files
- Your codebase views reference 350 of those files
- **Coverage: 70%** (350/500 files documented)

## Implementation

### Files Added

1. **GitHubCoverageCalculator.ts** - Coverage calculation without glob/filesystem scanning
2. **Enhanced GitHubFileSystemAdapter** - Added `getAllFiles()` method to access cached tree
3. **test-github-coverage.ts** - Example usage and testing

### How It Works

The coverage calculator bypasses the need for glob pattern matching by using the cached GitHub tree data:

```typescript
// 1. Get all files from GitHub tree cache (already fetched)
const allFiles = adapter.getAllFiles();

// 2. Filter by extension and ignore patterns
const sourceFiles = allFiles.filter(file =>
  file.endsWith('.ts') && !file.includes('node_modules/')
);

// 3. Get files referenced in views
const referencedFiles = getReferencedFilesFromViews(palace);

// 4. Calculate coverage percentage
const coverage = (referencedFiles.size / sourceFiles.size) * 100;
```

## Usage

### Basic Example

```typescript
import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { getGitHubCodebaseCoverage } from "./utils/GitHubCoverageCalculator";

async function calculateCoverage() {
  // 1. Create GitHub adapter
  const adapter = new GitHubFileSystemAdapter("owner", "repo", "main");
  await adapter.initialize();
  await adapter.prefetchAlexandriaFiles();

  // 2. Create Memory Palace
  const palace = new MemoryPalace(adapter.getGitHubPath(), adapter);

  // 3. Calculate coverage
  const coverage = getGitHubCodebaseCoverage(adapter, palace);

  console.log(`Coverage: ${coverage.coveragePercentage.toFixed(2)}%`);
  console.log(`Files covered: ${coverage.coveredFiles}/${coverage.totalFiles}`);
}
```

### With Custom Options

```typescript
// Only include specific extensions
const coverage = getGitHubCodebaseCoverage(adapter, palace, {
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx'],
  excludePatterns: ['node_modules/', 'dist/', 'test/']
});
```

### Running the Test

```bash
# From packages/core directory
npm run test:github-coverage

# Or with tsx directly
npx tsx src/test-github-coverage.ts
```

## Coverage Metrics

The calculator returns these metrics:

```typescript
interface CoverageMetrics {
  totalFiles: number;              // Total source files found
  coveredFiles: number;            // Files referenced in views
  coveredFilesList: string[];      // List of covered files
  uncoveredFiles: string[];        // List of uncovered files
  coveragePercentage: number;      // Coverage as percentage (0-100)
  filesByExtension: Map<string, {  // Breakdown by file type
    total: number;
    covered: number;
  }>;
}
```

## What Gets Scanned

### Included Extensions (Default)
- TypeScript: `.ts`, `.tsx`
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`
- Python: `.py`
- Go: `.go`
- Rust: `.rs`
- Java: `.java`
- C/C++: `.c`, `.cpp`, `.h`
- And 30+ more...

### Excluded Patterns (Default)
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `coverage/`
- `.alexandria/`
- `.next/`, `.turbo/`
- `__pycache__/`, `.pytest_cache/`
- `venv/`, `.venv/`

## Key Differences from CLI Coverage

**CLI Coverage (uses globby):**
- Requires local filesystem access
- Recursively scans directories
- Parses glob patterns like `**/*.ts`
- Respects `.gitignore` files

**GitHub Coverage (uses cached tree):**
- Works with GitHub API data
- No filesystem scanning needed
- Simple extension filtering
- No glob pattern parsing required

## Advantages

1. **No glob dependencies** - Avoids complex pattern matching libraries
2. **Fast** - Uses already-cached GitHub tree data
3. **Simple** - Just filters by file extension
4. **Accurate** - Same calculation logic as CLI version

## Limitations

- Only works with GitHub repositories (not local filesystems)
- Requires GitHub tree to be initialized first
- Cannot use complex glob patterns (but simple extension filtering works fine for coverage)
