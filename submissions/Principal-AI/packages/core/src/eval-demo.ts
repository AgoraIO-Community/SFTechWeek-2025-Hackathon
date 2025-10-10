/**
 * Demo Question Evaluation Framework
 *
 * Runs the demo questions multiple times to verify:
 * - Intent classification consistency
 * - Response quality
 * - Context loading decisions
 * - Voice-friendliness
 */

import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter.js";
import { LLMService, ConversationMessage } from "./services/LLMService.js";
import { QuestionIntent } from "./services/ViewAwareContextBuilder.js";

interface DemoQuestion {
  id: string;
  category: string;
  question: string;
  expectedIntent: "overview" | "implementation" | "usage" | "comparison";
  successCriteria: {
    mustInclude?: string[];      // Keywords that must appear in response
    mustNotInclude?: string[];   // Keywords that should not appear
    minLength?: number;           // Minimum response length in words
    maxLength?: number;           // Maximum response length for voice
    shouldReferenceFiles?: boolean;  // Should cite specific files
    shouldBeVoiceFriendly?: boolean; // Should be suitable for TTS
  };
}

interface EvalResult {
  question: DemoQuestion;
  intent: QuestionIntent;
  response: string;
  metrics: {
    intentCorrect: boolean;
    responseLength: number;
    includesRequired: boolean;
    excludesForbidden: boolean;
    referencesFiles: boolean;
    voiceFriendly: boolean;
    overallScore: number;  // 0-100
  };
  issues: string[];
}

interface EvalSummary {
  totalQuestions: number;
  passedQuestions: number;
  failedQuestions: number;
  averageScore: number;
  intentAccuracy: number;
  results: EvalResult[];
}

// Demo questions for evaluation
const DEMO_QUESTIONS: DemoQuestion[] = [
  // Overview Questions
  {
    id: "overview-1",
    category: "Overview",
    question: "What is this codebase about?",
    expectedIntent: "overview",
    successCriteria: {
      mustInclude: ["memory", "palace", "codebase"],
      minLength: 50,
      maxLength: 300,
      shouldBeVoiceFriendly: true
    }
  },
  {
    id: "overview-2",
    category: "Overview",
    question: "Explain the architecture of this project",
    expectedIntent: "overview",
    successCriteria: {
      mustInclude: ["architecture"],
      minLength: 50,
      maxLength: 300,
      shouldBeVoiceFriendly: true
    }
  },

  // Implementation Questions
  {
    id: "implementation-1",
    category: "Implementation",
    question: "How does the MemoryPalace class work?",
    expectedIntent: "implementation",
    successCriteria: {
      mustInclude: ["MemoryPalace"],
      minLength: 100,
      shouldReferenceFiles: true,
      shouldBeVoiceFriendly: true
    }
  },
  {
    id: "implementation-2",
    category: "Implementation",
    question: "Show me how the GitHubAdapter fetches files",
    expectedIntent: "implementation",
    successCriteria: {
      mustInclude: ["GitHub", "fetch"],
      shouldReferenceFiles: true,
      minLength: 100
    }
  },
  {
    id: "implementation-3",
    category: "Implementation",
    question: "How does the prefetchAlexandriaFiles method work?",
    expectedIntent: "implementation",
    successCriteria: {
      mustInclude: ["prefetch"],
      shouldReferenceFiles: true,
      minLength: 100
    }
  },

  // Usage Questions
  {
    id: "usage-1",
    category: "Usage",
    question: "How do I use the MemoryPalace API?",
    expectedIntent: "usage",
    successCriteria: {
      mustInclude: ["use", "api"],
      minLength: 80,
      maxLength: 400,
      shouldBeVoiceFriendly: true
    }
  },
  {
    id: "usage-2",
    category: "Usage",
    question: "How do I get started with this library?",
    expectedIntent: "usage",
    successCriteria: {
      mustInclude: ["start"],
      minLength: 80,
      maxLength: 400,
      shouldBeVoiceFriendly: true
    }
  },
  {
    id: "usage-3",
    category: "Usage",
    question: "Give me an example of loading a repository",
    expectedIntent: "usage",
    successCriteria: {
      mustInclude: ["example", "repository"],
      minLength: 80,
      shouldBeVoiceFriendly: true
    }
  },

  // Comparison Questions
  {
    id: "comparison-1",
    category: "Comparison",
    question: "What's the difference between getView and listViews?",
    expectedIntent: "comparison",
    successCriteria: {
      mustInclude: ["getView", "listViews"],
      minLength: 80,
      maxLength: 400,
      shouldBeVoiceFriendly: true
    }
  },
  {
    id: "comparison-2",
    category: "Comparison",
    question: "When should I use GitHubAdapter vs GitHubGlobAdapter?",
    expectedIntent: "comparison",
    successCriteria: {
      mustInclude: ["GitHubAdapter", "GitHubGlobAdapter"],
      minLength: 80,
      shouldBeVoiceFriendly: true
    }
  }
];

class DemoEvaluator {
  constructor(
    private palace: MemoryPalace,
    private fsAdapter: GitHubFileSystemAdapter,
    private llmService: LLMService
  ) {}

  /**
   * Run evaluation on all demo questions
   */
  async runEvaluation(): Promise<EvalSummary> {
    console.log("🧪 Starting Demo Question Evaluation\n");
    console.log(`📋 Total questions: ${DEMO_QUESTIONS.length}\n`);

    const results: EvalResult[] = [];
    const conversationHistory: ConversationMessage[] = [];

    for (let i = 0; i < DEMO_QUESTIONS.length; i++) {
      const question = DEMO_QUESTIONS[i];

      console.log("─".repeat(80));
      console.log(`[${i + 1}/${DEMO_QUESTIONS.length}] ${question.category}: ${question.id}`);
      console.log(`Q: "${question.question}"`);
      console.log("─".repeat(80));

      const result = await this.evaluateQuestion(question, conversationHistory);
      results.push(result);

      // Add to conversation history for follow-up context
      conversationHistory.push({
        role: "user",
        content: question.question
      });
      conversationHistory.push({
        role: "assistant",
        content: result.response
      });

      // Print result summary
      this.printQuestionResult(result);
      console.log();

      // Pause between questions
      await new Promise(resolve => global.setTimeout(resolve, 500));
    }

    return this.generateSummary(results);
  }

  /**
   * Evaluate a single question
   */
  private async evaluateQuestion(
    question: DemoQuestion,
    history: ConversationMessage[]
  ): Promise<EvalResult> {
    const issues: string[] = [];

    try {
      // Get response using two-stage method
      const { response, intent } = await this.llmService.generateViewAwareResponse(
        this.palace,
        this.fsAdapter,
        question.question,
        history,
        { stream: false }
      );

      // Evaluate metrics
      const metrics = this.evaluateResponse(question, intent, response, issues);

      return {
        question,
        intent,
        response,
        metrics,
        issues
      };

    } catch (error) {
      issues.push(`Error: ${error}`);

      return {
        question,
        intent: {
          type: "overview",
          confidence: 0,
          relevantViews: [],
          relevantFiles: [],
          keywords: [],
          needsFileContent: false
        },
        response: "",
        metrics: {
          intentCorrect: false,
          responseLength: 0,
          includesRequired: false,
          excludesForbidden: false,
          referencesFiles: false,
          voiceFriendly: false,
          overallScore: 0
        },
        issues
      };
    }
  }

  /**
   * Evaluate response against success criteria
   */
  private evaluateResponse(
    question: DemoQuestion,
    intent: QuestionIntent,
    response: string,
    issues: string[]
  ): EvalResult["metrics"] {
    const { successCriteria } = question;
    let score = 0;

    // 1. Intent Classification (20 points)
    const intentCorrect = intent.type === question.expectedIntent;
    if (intentCorrect) {
      score += 20;
    } else {
      issues.push(`Intent mismatch: expected ${question.expectedIntent}, got ${intent.type}`);
    }

    // 2. Response Length (15 points)
    const wordCount = response.split(/\s+/).length;
    const responseLength = wordCount;

    if (successCriteria.minLength && wordCount < successCriteria.minLength) {
      issues.push(`Response too short: ${wordCount} words (min: ${successCriteria.minLength})`);
    } else if (successCriteria.maxLength && wordCount > successCriteria.maxLength) {
      issues.push(`Response too long for voice: ${wordCount} words (max: ${successCriteria.maxLength})`);
    } else {
      score += 15;
    }

    // 3. Required Keywords (25 points)
    let includesRequired = true;
    if (successCriteria.mustInclude) {
      const responseLower = response.toLowerCase();
      const missing = successCriteria.mustInclude.filter(
        keyword => !responseLower.includes(keyword.toLowerCase())
      );

      if (missing.length > 0) {
        includesRequired = false;
        issues.push(`Missing required keywords: ${missing.join(", ")}`);
      } else {
        score += 25;
      }
    } else {
      score += 25;
    }

    // 4. Forbidden Keywords (10 points)
    let excludesForbidden = true;
    if (successCriteria.mustNotInclude) {
      const responseLower = response.toLowerCase();
      const found = successCriteria.mustNotInclude.filter(
        keyword => responseLower.includes(keyword.toLowerCase())
      );

      if (found.length > 0) {
        excludesForbidden = false;
        issues.push(`Contains forbidden keywords: ${found.join(", ")}`);
      } else {
        score += 10;
      }
    } else {
      score += 10;
    }

    // 5. File References (15 points)
    const referencesFiles = this.hasFileReferences(response);
    if (successCriteria.shouldReferenceFiles) {
      if (referencesFiles) {
        score += 15;
      } else {
        issues.push("Should reference specific files but doesn't");
      }
    } else {
      score += 15;
    }

    // 6. Voice Friendliness (15 points)
    const voiceFriendly = this.isVoiceFriendly(response);
    if (successCriteria.shouldBeVoiceFriendly) {
      if (voiceFriendly) {
        score += 15;
      } else {
        issues.push("Response not optimized for voice/TTS");
      }
    } else {
      score += 15;
    }

    return {
      intentCorrect,
      responseLength,
      includesRequired,
      excludesForbidden,
      referencesFiles,
      voiceFriendly,
      overallScore: Math.round(score)
    };
  }

  /**
   * Check if response references specific files
   */
  private hasFileReferences(response: string): boolean {
    // Look for file path patterns
    const filePatterns = [
      /src[/][a-zA-Z0-9/_\-.]+\.ts/,
      /\.alexandria[/][a-zA-Z0-9/_\-.]+/,
      /[a-zA-Z0-9\-_]+\.ts/
    ];

    return filePatterns.some(pattern => pattern.test(response));
  }

  /**
   * Check if response is voice-friendly
   */
  private isVoiceFriendly(response: string): boolean {
    // Voice-friendly criteria:
    // - Not too many code blocks
    // - Uses natural language
    // - Has clear structure

    const codeBlockCount = (response.match(/```/g) || []).length / 2;
    const tooManyCodeBlocks = codeBlockCount > 2;

    // Check for natural language indicators
    const hasNaturalLanguage = /\b(first|second|third|next|then|finally|basically|essentially)\b/i.test(response);

    // Check for clear structure (numbered lists, etc)
    const hasStructure = /\n\d+\.|\n-/.test(response);

    return !tooManyCodeBlocks && (hasNaturalLanguage || hasStructure);
  }

  /**
   * Print result for a single question
   */
  private printQuestionResult(result: EvalResult): void {
    const { metrics, issues } = result;

    console.log(`\n✓ Intent: ${result.intent.type} ${metrics.intentCorrect ? "✅" : "❌"}`);
    console.log(`✓ Response Length: ${metrics.responseLength} words`);
    console.log(`✓ Score: ${metrics.overallScore}/100`);

    if (issues.length > 0) {
      console.log(`\n⚠️  Issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
  }

  /**
   * Generate summary report
   */
  private generateSummary(results: EvalResult[]): EvalSummary {
    const totalQuestions = results.length;
    const passedQuestions = results.filter(r => r.metrics.overallScore >= 70).length;
    const failedQuestions = totalQuestions - passedQuestions;

    const averageScore = results.reduce((sum, r) => sum + r.metrics.overallScore, 0) / totalQuestions;

    const correctIntents = results.filter(r => r.metrics.intentCorrect).length;
    const intentAccuracy = (correctIntents / totalQuestions) * 100;

    return {
      totalQuestions,
      passedQuestions,
      failedQuestions,
      averageScore,
      intentAccuracy,
      results
    };
  }

  /**
   * Print final summary
   */
  printSummary(summary: EvalSummary): void {
    console.log("\n" + "=".repeat(80));
    console.log("📊 EVALUATION SUMMARY");
    console.log("=".repeat(80));

    console.log(`\nTotal Questions: ${summary.totalQuestions}`);
    console.log(`Passed (≥70): ${summary.passedQuestions} ✅`);
    console.log(`Failed (<70): ${summary.failedQuestions} ${summary.failedQuestions > 0 ? "❌" : ""}`);
    console.log(`\nAverage Score: ${summary.averageScore.toFixed(1)}/100`);
    console.log(`Intent Accuracy: ${summary.intentAccuracy.toFixed(1)}%`);

    // Breakdown by category
    console.log("\n" + "─".repeat(80));
    console.log("Breakdown by Category:");
    console.log("─".repeat(80));

    const categories = [...new Set(summary.results.map(r => r.question.category))];
    categories.forEach(category => {
      const categoryResults = summary.results.filter(r => r.question.category === category);
      const avgScore = categoryResults.reduce((sum, r) => sum + r.metrics.overallScore, 0) / categoryResults.length;
      const passed = categoryResults.filter(r => r.metrics.overallScore >= 70).length;

      console.log(`\n${category}:`);
      console.log(`  Questions: ${categoryResults.length}`);
      console.log(`  Passed: ${passed}/${categoryResults.length}`);
      console.log(`  Avg Score: ${avgScore.toFixed(1)}/100`);
    });

    // Failed questions
    if (summary.failedQuestions > 0) {
      console.log("\n" + "─".repeat(80));
      console.log("Failed Questions (Score < 70):");
      console.log("─".repeat(80));

      summary.results
        .filter(r => r.metrics.overallScore < 70)
        .forEach(result => {
          console.log(`\n❌ ${result.question.id}: "${result.question.question}"`);
          console.log(`   Score: ${result.metrics.overallScore}/100`);
          console.log(`   Issues:`);
          result.issues.forEach(issue => console.log(`     - ${issue}`));
        });
    }

    console.log("\n" + "=".repeat(80));
  }

  /**
   * Save results to JSON file
   */
  async saveResults(summary: EvalSummary, filename: string): Promise<void> {
    const fs = await import("fs");
    const path = await import("path");

    const outputPath = path.join(process.cwd(), filename);

    fs.writeFileSync(
      outputPath,
      JSON.stringify(summary, null, 2),
      "utf-8"
    );

    console.log(`\n💾 Results saved to: ${outputPath}`);
  }
}

/**
 * Main evaluation runner
 */
async function runDemoEval() {
  const githubToken = process.env.GITHUB_TOKEN;
  const groqApiKey = process.env.GROQ_API_KEY;

  if (!githubToken || !groqApiKey) {
    console.error("❌ Missing environment variables");
    console.error("   Required: GITHUB_TOKEN, GROQ_API_KEY");
    process.exit(1);
  }

  // Setup
  console.log("🔧 Setting up evaluation environment...\n");

  const fsAdapter = new GitHubFileSystemAdapter(
    "a24z-ai",
    "core-library",
    "main",
    githubToken
  );

  await fsAdapter.prefetchAlexandriaFiles();
  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });

  console.log("✅ Setup complete\n");

  // Run evaluation
  const evaluator = new DemoEvaluator(palace, fsAdapter, llmService);
  const summary = await evaluator.runEvaluation();

  // Print summary
  evaluator.printSummary(summary);

  // Save results
  await evaluator.saveResults(summary, "eval-results.json");
}

// Run evaluation
runDemoEval().catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
