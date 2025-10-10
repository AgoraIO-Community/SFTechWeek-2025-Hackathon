/**
 * GlobAdapter for GitHub repositories
 * Fetches markdown files via GitHub API
 */

import type { GlobAdapter, GlobOptions } from "@a24z/core-library";

interface GitHubTreeItem {
  path: string;
  mode: string;
  type: string;
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeItem[];
  truncated: boolean;
}

export class GitHubGlobAdapter implements GlobAdapter {
  private owner: string;
  private repo: string;
  private branch: string;
  private token?: string;
  private treeCache?: GitHubTreeResponse;

  constructor(
    owner: string,
    repo: string,
    branch = "main",
    token?: string,
  ) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
  }

  /**
   * Find files matching glob patterns in the GitHub repository
   */
  async findFiles(
    patterns: string[],
    _options?: GlobOptions,
  ): Promise<string[]> {
    // Fetch the entire repository tree from GitHub
    const tree = await this.fetchRepositoryTree();

    // Filter files based on patterns
    const matchedFiles = tree.tree
      .filter((item) => {
        // Only include files (blob type)
        if (item.type !== "blob") return false;

        // Check if file matches any pattern
        return patterns.some((pattern) =>
          this.matchesPattern(item.path, pattern),
        );
      })
      .map((item) => item.path);

    return matchedFiles;
  }

  /**
   * Fetch the complete file tree from GitHub API
   */
  private async fetchRepositoryTree(): Promise<GitHubTreeResponse> {
    // Return cached tree if available
    if (this.treeCache) {
      return this.treeCache;
    }

    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Principal-AI-Hackathon",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    this.treeCache = (await response.json()) as GitHubTreeResponse;
    return this.treeCache;
  }

  /**
   * Simple glob pattern matching
   * Supports: *.md, **\/*.md, **\/*.mdx, .alexandria/**\/*
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    // **/*.md -> match any .md file at any depth
    // *.md -> match .md files in root only
    // .alexandria/**/* -> match any file in .alexandria directory

    if (pattern === "**/*.md") {
      return filePath.endsWith(".md");
    }

    if (pattern === "**/*.mdx") {
      return filePath.endsWith(".mdx");
    }

    if (pattern === "*.md") {
      return filePath.endsWith(".md") && !filePath.includes("/");
    }

    if (pattern === "*.mdx") {
      return filePath.endsWith(".mdx") && !filePath.includes("/");
    }

    // .alexandria/**/* -> any file in .alexandria directory
    if (pattern === ".alexandria/**/*") {
      return filePath.startsWith(".alexandria/");
    }

    // .alexandria/views/*.json -> JSON files in views directory
    if (pattern === ".alexandria/views/*.json") {
      return (
        filePath.startsWith(".alexandria/views/") &&
        filePath.endsWith(".json") &&
        filePath.split("/").length === 3
      );
    }

    // .alexandria/overviews/*.md -> markdown files in overviews directory
    if (pattern === ".alexandria/overviews/*.md") {
      return (
        filePath.startsWith(".alexandria/overviews/") &&
        filePath.endsWith(".md") &&
        filePath.split("/").length === 3
      );
    }

    // Fallback: check if file path includes pattern
    return filePath.includes(pattern);
  }

  /**
   * Optional: Check if a path matches patterns
   */
  matchesPath(patterns: string[] | undefined, candidate: string): boolean {
    if (!patterns || patterns.length === 0) return true;
    return patterns.some((pattern) => this.matchesPattern(candidate, pattern));
  }
}
