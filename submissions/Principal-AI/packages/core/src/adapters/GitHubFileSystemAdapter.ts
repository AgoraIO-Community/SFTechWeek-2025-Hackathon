/**
 * Enhanced GitHub FileSystemAdapter that pre-fetches and caches files
 * Works with MemoryPalace by caching .alexandria directory structure
 */

import { FileSystemAdapter } from "@a24z/core-library";

interface GitHubTreeItem {
  path: string;
  type: string;
  sha: string;
}

export class GitHubFileSystemAdapter implements FileSystemAdapter {
  private githubPath: string;
  private owner: string;
  private repo: string;
  private branch: string;
  private token?: string;

  // Cache for file contents and directory structure
  private fileCache = new Map<string, string>();
  private directoryCache = new Map<string, string[]>();
  private treeCache: GitHubTreeItem[] = [];
  private initialized = false;

  constructor(owner: string, repo: string, branch = "main", token?: string) {
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.token = token;
    this.githubPath = `/github/${owner}/${repo}`;
  }

  /**
   * Initialize by fetching the repository tree and caching structure
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log(`🔄 Fetching repository tree from GitHub...`);

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
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const tree: GitHubTreeItem[] = data.tree;

    // Store tree for coverage calculations
    this.treeCache = tree;

    // Build directory structure
    tree.forEach((item) => {
      if (item.type === "tree") {
        // It's a directory
        const fullPath = this.join(this.githubPath, item.path);
        this.directoryCache.set(fullPath, []);
      }
    });

    // Populate directory listings with files
    tree.forEach((item) => {
      if (item.type === "blob") {
        const fullPath = this.join(this.githubPath, item.path);
        const parentDir = this.dirname(fullPath);
        const fileName = item.path.split("/").pop()!;

        if (!this.directoryCache.has(parentDir)) {
          this.directoryCache.set(parentDir, []);
        }
        this.directoryCache.get(parentDir)?.push(fileName);
      }
    });

    // Add subdirectories to parent listings
    tree.forEach((item) => {
      if (item.type === "tree") {
        const fullPath = this.join(this.githubPath, item.path);
        const parentDir = this.dirname(fullPath);
        const dirName = item.path.split("/").pop()!;

        if (parentDir !== this.githubPath && !this.directoryCache.has(parentDir)) {
          this.directoryCache.set(parentDir, []);
        }

        if (parentDir && parentDir !== fullPath) {
          const parentFiles = this.directoryCache.get(parentDir);
          if (parentFiles && !parentFiles.includes(dirName)) {
            parentFiles.push(dirName);
          }
        }
      }
    });

    // Add root directory
    this.directoryCache.set(this.githubPath, []);

    // Ensure .alexandria is in root listing
    const rootListing = this.directoryCache.get(this.githubPath);
    if (rootListing && !rootListing.includes(".alexandria")) {
      rootListing.push(".alexandria");
    }

    this.initialized = true;
    console.log(`✅ Cached ${tree.length} items from GitHub`);
  }

  /**
   * Fetch file content from GitHub and cache it
   */
  private async fetchAndCacheFile(relativePath: string): Promise<string> {
    const cacheKey = this.join(this.githubPath, relativePath);

    if (this.fileCache.has(cacheKey)) {
      return this.fileCache.get(cacheKey)!;
    }

    const url = `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${relativePath}?ref=${this.branch}`;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Principal-AI-Hackathon",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${relativePath}: ${response.status}`);
    }

    const data = await response.json();

    // Decode base64 content
    let content = "";
    if (data.encoding === "base64") {
      content = Buffer.from(data.content, "base64").toString("utf-8");
    } else {
      content = data.content;
    }

    this.fileCache.set(cacheKey, content);
    return content;
  }

  // ===== VALIDATION METHODS =====

  isAbsolute(path: string): boolean {
    return path.startsWith("/");
  }

  exists(path: string): boolean {
    // Root always exists
    if (path === this.githubPath) return true;

    // .git directory exists (fake it)
    if (path === this.join(this.githubPath, ".git")) return true;

    // Check directory cache
    if (this.directoryCache.has(path)) return true;

    // Check file cache
    if (this.fileCache.has(path)) return true;

    return false;
  }

  isDirectory(path: string): boolean {
    return this.directoryCache.has(path);
  }

  findProjectRoot(_inputPath: string): string {
    return this.githubPath;
  }

  normalizeRepositoryPath(inputPath: string): string {
    return inputPath;
  }

  getRepositoryName(_repositoryPath: string): string {
    return this.repo;
  }

  // ===== PATH METHODS =====

  join(...paths: string[]): string {
    return paths
      .join("/")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "");
  }

  relative(from: string, to: string): string {
    if (to.startsWith(from)) {
      return to.slice(from.length).replace(/^\//, "");
    }
    return to;
  }

  dirname(path: string): string {
    const parts = path.split("/");
    parts.pop();
    return parts.join("/") || "/";
  }

  // ===== FILE OPERATIONS =====

  readFile(path: string): string {
    // If already cached, return it
    if (this.fileCache.has(path)) {
      return this.fileCache.get(path)!;
    }

    // Extract relative path for better error message
    const relativePath = this.relative(this.githubPath, path);

    throw new Error(
      `File not cached: ${relativePath}. Call prefetchAlexandriaFiles() first.`
    );
  }

  /**
   * Pre-fetch all .alexandria files for MemoryPalace
   */
  async prefetchAlexandriaFiles(): Promise<void> {
    await this.initialize();

    console.log(`📚 Pre-fetching .alexandria files...`);

    // Find all files in .alexandria directory
    const alexandriaFiles: string[] = [];
    this.directoryCache.forEach((files, dir) => {
      if (dir.includes(".alexandria")) {
        files.forEach((file) => {
          const fullPath = this.join(dir, file);
          const relativePath = this.relative(this.githubPath, fullPath);
          alexandriaFiles.push(relativePath);
        });
      }
    });

    // Also add root-level config files
    const configFiles = [".alexandriarc.json", ".alexandriarc", "alexandria.json"];
    for (const configFile of configFiles) {
      const exists = this.directoryCache.get(this.githubPath)?.includes(configFile);
      if (exists) {
        alexandriaFiles.push(configFile);
      }
    }

    console.log(`   Found ${alexandriaFiles.length} files to cache`);

    // Fetch all .alexandria files
    for (const file of alexandriaFiles) {
      try {
        await this.fetchAndCacheFile(file);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`   ⚠️  Failed to fetch ${file}: ${errorMsg}`);
      }
    }

    console.log(`✅ Cached ${this.fileCache.size} .alexandria files`);
  }

  writeFile(path: string, content: string): void {
    this.fileCache.set(path, content);
  }

  deleteFile(path: string): void {
    this.fileCache.delete(path);
  }

  readBinaryFile(_path: string): Uint8Array {
    return new Uint8Array();
  }

  writeBinaryFile(_path: string, _content: Uint8Array): void {
    // Not implemented
  }

  createDir(path: string): void {
    // Only create if it doesn't already exist
    // This prevents overwriting directories we've already cached
    if (!this.directoryCache.has(path)) {
      this.directoryCache.set(path, []);
    }
  }

  readDir(path: string): string[] {
    return this.directoryCache.get(path) || [];
  }

  deleteDir(path: string): void {
    this.directoryCache.delete(path);
  }

  getGitHubPath(): string {
    return this.githubPath;
  }

  /**
   * Get all files from the cached GitHub tree
   * Returns relative paths (not prefixed with githubPath)
   */
  getAllFiles(): string[] {
    return this.treeCache
      .filter((item) => item.type === "blob")
      .map((item) => item.path);
  }
}
