/**
 * GitHub-specific coverage calculator
 * Calculates codebase view coverage without requiring glob/filesystem scanning
 */

import { MemoryPalace } from "@a24z/core-library";
import type { GitHubFileSystemAdapter } from "../adapters/GitHubFileSystemAdapter";

const DEFAULT_SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".py",
  ".rb",
  ".go",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".rs",
  ".swift",
  ".kt",
  ".scala",
  ".php",
  ".cs",
  ".vue",
  ".svelte",
  ".astro",
  ".md",
  ".mdx",
  ".json",
  ".yaml",
  ".yml",
  ".toml",
  ".xml",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".html",
];

/**
 * Patterns to ignore when calculating coverage
 */
const DEFAULT_IGNORE_PATTERNS = [
  "node_modules/",
  ".git/",
  "dist/",
  "build/",
  "coverage/",
  ".alexandria/",
  ".next/",
  ".turbo/",
  "out/",
  "target/",
  "vendor/",
  "__pycache__/",
  ".pytest_cache/",
  ".venv/",
  "venv/",
];

export interface CoverageOptions {
  includeExtensions?: string[];
  excludePatterns?: string[];
}

export interface CoverageMetrics {
  totalFiles: number;
  coveredFiles: number;
  coveredFilesList: string[];
  uncoveredFiles: string[];
  coveragePercentage: number;
  filesByExtension: Map<
    string,
    {
      total: number;
      covered: number;
    }
  >;
}

/**
 * Get all source files from GitHub tree cache
 */
export function getAllSourceFilesFromGitHub(
  adapter: GitHubFileSystemAdapter,
  options: CoverageOptions = {}
): Set<string> {
  const validExtensions =
    options.includeExtensions || DEFAULT_SOURCE_EXTENSIONS;
  const ignorePatterns = options.excludePatterns || DEFAULT_IGNORE_PATTERNS;

  const allFiles = adapter.getAllFiles();

  const sourceFiles = allFiles.filter((filePath) => {
    // Check if file should be ignored
    const shouldIgnore = ignorePatterns.some((pattern) =>
      filePath.includes(pattern)
    );
    if (shouldIgnore) return false;

    // Check if file has a valid extension
    const hasValidExtension = validExtensions.some((ext) =>
      filePath.endsWith(ext)
    );
    return hasValidExtension;
  });

  return new Set(sourceFiles);
}

/**
 * Get all files referenced in codebase views
 */
export function getReferencedFilesFromViews(
  palace: MemoryPalace
): Set<string> {
  const referencedFiles = new Set<string>();
  const views = palace.listViews();

  for (const view of views) {
    if (view.referenceGroups) {
      for (const cellName in view.referenceGroups) {
        const cell = view.referenceGroups[cellName];

        // Check if it's a file cell (has 'files' property)
        if (cell && "files" in cell && Array.isArray(cell.files)) {
          for (const file of cell.files) {
            // Normalize the file path (remove leading slash if present)
            const normalizedFile = file.startsWith("/") ? file.slice(1) : file;
            referencedFiles.add(normalizedFile);
          }
        }
      }
    }
  }

  return referencedFiles;
}

/**
 * Calculate coverage metrics
 */
export function calculateCoverageMetrics(
  sourceFiles: Set<string>,
  referencedFiles: Set<string>
): CoverageMetrics {
  const uncoveredFiles: string[] = [];
  const coveredFilesList: string[] = [];
  const filesByExtension = new Map<
    string,
    {
      total: number;
      covered: number;
    }
  >();

  for (const file of sourceFiles) {
    // Get extension (e.g., ".ts", ".js")
    const lastDotIndex = file.lastIndexOf(".");
    const ext = lastDotIndex !== -1 ? file.slice(lastDotIndex) : "no-ext";

    // Update extension stats
    if (!filesByExtension.has(ext)) {
      filesByExtension.set(ext, { total: 0, covered: 0 });
    }

    const extStats = filesByExtension.get(ext)!;
    extStats.total++;

    // Check if file is covered
    if (referencedFiles.has(file)) {
      extStats.covered++;
      coveredFilesList.push(file);
    } else {
      uncoveredFiles.push(file);
    }
  }

  // Sort both lists for consistent output
  uncoveredFiles.sort();
  coveredFilesList.sort();

  const totalFiles = sourceFiles.size;
  const coveredFiles = coveredFilesList.length;
  const coveragePercentage =
    totalFiles > 0 ? (coveredFiles / totalFiles) * 100 : 100;

  return {
    totalFiles,
    coveredFiles,
    coveredFilesList,
    uncoveredFiles,
    coveragePercentage,
    filesByExtension,
  };
}

/**
 * Calculate codebase view coverage for a GitHub repository
 */
export function getGitHubCodebaseCoverage(
  adapter: GitHubFileSystemAdapter,
  palace: MemoryPalace,
  options: CoverageOptions = {}
): CoverageMetrics {
  // Get all source files from GitHub tree
  const sourceFiles = getAllSourceFilesFromGitHub(adapter, options);

  // Get all files referenced in codebase views
  const referencedFiles = getReferencedFilesFromViews(palace);

  // Calculate and return metrics
  return calculateCoverageMetrics(sourceFiles, referencedFiles);
}
