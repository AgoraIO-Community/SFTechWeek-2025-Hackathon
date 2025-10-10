/**
 * Test script for GitHub coverage calculation
 * Demonstrates how to calculate codebase view coverage for a GitHub repository
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import { getGitHubCodebaseCoverage } from "./utils/GitHubCoverageCalculator";

async function testGitHubCoverage() {
  // Example: Calculate coverage for the Principal-AI repository
  const owner = "anthropics";
  const repo = "claude-code";
  const branch = "main";

  console.log(`📊 Calculating coverage for ${owner}/${repo}...\n`);

  // 1. Create and initialize the GitHub adapter
  const adapter = new GitHubFileSystemAdapter(owner, repo, branch);
  await adapter.initialize();
  await adapter.prefetchAlexandriaFiles();

  // 2. Create MemoryPalace instance
  const githubPath = adapter.getGitHubPath();
  const palace = new MemoryPalace(githubPath, adapter);

  // 3. Calculate coverage
  const coverage = getGitHubCodebaseCoverage(adapter, palace);

  // 4. Display results
  console.log("📈 Coverage Results:");
  console.log(`   Total source files: ${coverage.totalFiles}`);
  console.log(`   Files in views: ${coverage.coveredFiles}`);
  console.log(
    `   Coverage: ${coverage.coveragePercentage.toFixed(2)}%\n`
  );

  // 5. Show breakdown by extension
  console.log("📋 Coverage by file type:");
  const sortedExtensions = Array.from(coverage.filesByExtension.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );

  for (const [ext, stats] of sortedExtensions.slice(0, 10)) {
    const pct = stats.total > 0 ? (stats.covered / stats.total) * 100 : 0;
    console.log(
      `   ${ext.padEnd(8)} ${stats.covered.toString().padStart(3)}/${stats.total.toString().padStart(3)} (${pct.toFixed(1)}%)`
    );
  }

  // 6. Show some uncovered files (first 10)
  if (coverage.uncoveredFiles.length > 0) {
    console.log(`\n📝 Sample uncovered files (showing 10 of ${coverage.uncoveredFiles.length}):`);
    coverage.uncoveredFiles.slice(0, 10).forEach((file) => {
      console.log(`   - ${file}`);
    });
  }

  // 7. Show some covered files (first 10)
  if (coverage.coveredFilesList.length > 0) {
    console.log(`\n✅ Sample covered files (showing 10 of ${coverage.coveredFilesList.length}):`);
    coverage.coveredFilesList.slice(0, 10).forEach((file) => {
      console.log(`   - ${file}`);
    });
  }
}

// Run the test
testGitHubCoverage().catch((error) => {
  console.error("❌ Error calculating coverage:", error);
  process.exit(1);
});
