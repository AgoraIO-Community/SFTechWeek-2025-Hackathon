/**
 * Test Diagram Generation - Validate LLM-generated Excalidraw diagrams
 *
 * This test evaluates whether the DiagramGenerator can create meaningful
 * visual representations of technical text.
 */

import { DiagramGenerator } from "./services/DiagramGenerator";
import { LLMService } from "./services/LLMService";
import { MemoryPalace } from "@a24z/core-library";
import { GitHubFileSystemAdapter } from "./adapters/GitHubFileSystemAdapter";
import * as fs from "fs";

async function testBasicDiagramGeneration() {
  console.log("\n🧪 Test 1: Basic Diagram Generation\n");
  console.log("=" .repeat(70));

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error("❌ GROQ_API_KEY not set");
    return;
  }

  const generator = new DiagramGenerator(groqApiKey);

  const testText = `
The LLMService is the main component that handles AI responses. It connects to
the MemoryPalace to retrieve context, then sends requests to the Groq API.
The ViewAwareContextBuilder analyzes questions and loads relevant files.
Finally, the ResponseParser extracts metadata from the generated responses.
`;

  console.log("📝 Input Text:\n");
  console.log(testText);
  console.log("\n🤔 Step 1: Analyzing if diagram would be useful...\n");

  const analysis = await generator.shouldGenerateDiagram(testText);
  console.log(`   Should Generate: ${analysis.shouldGenerate}`);
  console.log(`   Reasoning: ${analysis.reasoning}`);
  if (analysis.diagramType) {
    console.log(`   Diagram Type: ${analysis.diagramType}`);
  }

  if (analysis.shouldGenerate) {
    console.log("\n🎨 Step 2: Generating Excalidraw diagram...\n");

    const diagram = await generator.generateDiagram(testText);

    console.log(`   ✅ Generated ${diagram.elements.length} elements:`);
    console.log();

    // Analyze generated elements
    const elementTypes = diagram.elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(elementTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    // Show sample elements
    console.log("\n   📋 Sample Elements:\n");
    diagram.elements.slice(0, 3).forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.type} at (${el.x}, ${el.y})`);
      if (el.text) console.log(`      Text: "${el.text}"`);
      if (el.width && el.height) console.log(`      Size: ${el.width}x${el.height}`);
    });

    // Save to file for manual inspection
    const filename = "test-diagram-output.excalidraw";
    fs.writeFileSync(filename, JSON.stringify(diagram, null, 2));
    console.log(`\n   💾 Saved diagram to ${filename}`);
    console.log(`   🔗 Open in Excalidraw: https://excalidraw.com`);

    // Validation checks
    console.log("\n   ✅ Validation Checks:\n");
    const hasValidIds = diagram.elements.every((el) => el.id && el.id.length > 0);
    const hasPositions = diagram.elements.every((el) => typeof el.x === "number" && typeof el.y === "number");
    const hasText = diagram.elements.some((el) => el.type === "text" && el.text);
    const hasShapes = diagram.elements.some((el) => ["rectangle", "ellipse", "diamond"].includes(el.type));
    const hasConnections = diagram.elements.some((el) => ["arrow", "line"].includes(el.type));

    console.log(`   - All elements have IDs: ${hasValidIds ? "✓" : "✗"}`);
    console.log(`   - All elements have positions: ${hasPositions ? "✓" : "✗"}`);
    console.log(`   - Has text labels: ${hasText ? "✓" : "✗"}`);
    console.log(`   - Has shapes: ${hasShapes ? "✓" : "✗"}`);
    console.log(`   - Has connections: ${hasConnections ? "✓" : "✗"}`);

    return {
      valid: hasValidIds && hasPositions && hasText && hasShapes,
      elementCount: diagram.elements.length,
      types: elementTypes,
    };
  }

  console.log("\n   ℹ️  No diagram generated (not recommended by analyzer)\n");
  return null;
}

async function testStreamingDiagramGeneration() {
  console.log("\n\n🧪 Test 2: Streaming Diagram Generation\n");
  console.log("=" .repeat(70));

  const groqApiKey = process.env.GROQ_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;

  if (!groqApiKey || !githubToken) {
    console.error("❌ Missing environment variables");
    return;
  }

  console.log("📚 Step 1: Setting up LLM service with real codebase context...\n");

  const fsAdapter = new GitHubFileSystemAdapter("a24z-ai", "core-library", "main", githubToken);
  await fsAdapter.prefetchAlexandriaFiles();

  const palace = new MemoryPalace(fsAdapter.getGitHubPath(), fsAdapter);
  const llmService = new LLMService({ apiKey: groqApiKey });
  const diagramGenerator = new DiagramGenerator(groqApiKey);

  const question = "How does the MemoryPalace system work? Explain the architecture.";

  console.log(`💬 Question: "${question}"\n`);
  console.log("📥 Step 2: Generating LLM response...\n");

  let accumulatedText = "";

  for await (const chunk of llmService.generateStreamingResponse(palace, question)) {
    process.stdout.write(chunk);
    accumulatedText += chunk;
  }

  console.log("\n\n🎨 Step 3: Generating diagram from accumulated response...\n");

  const diagram = await diagramGenerator.generateDiagramFromStream(accumulatedText);

  if (diagram) {
    console.log(`   ✅ Generated diagram with ${diagram.elements.length} elements\n`);

    const elementTypes = diagram.elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log("   Element breakdown:");
    Object.entries(elementTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    // Save diagram
    const filename = "test-streaming-diagram.excalidraw";
    fs.writeFileSync(filename, JSON.stringify(diagram, null, 2));
    console.log(`\n   💾 Saved diagram to ${filename}`);

    return {
      generated: true,
      elementCount: diagram.elements.length,
      types: elementTypes,
    };
  } else {
    console.log("   ℹ️  No diagram generated from this response\n");
    return { generated: false };
  }
}

async function testMultipleDiagramTypes() {
  console.log("\n\n🧪 Test 3: Multiple Diagram Type Scenarios\n");
  console.log("=" .repeat(70));

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.error("❌ GROQ_API_KEY not set");
    return;
  }

  const generator = new DiagramGenerator(groqApiKey);

  const scenarios = [
    {
      name: "Architecture",
      text: "The system has three layers: the presentation layer handles UI, the business logic layer processes requests, and the data layer manages persistence.",
    },
    {
      name: "Flow Process",
      text: "First, the user submits a request. Then, the system validates the input. If valid, it processes the data and returns a response. If invalid, it returns an error.",
    },
    {
      name: "Simple Explanation",
      text: "JavaScript is a programming language used for web development.",
    },
  ];

  const results = [];

  for (const scenario of scenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}\n`);
    console.log(`   Text: "${scenario.text}"\n`);

    const analysis = await generator.shouldGenerateDiagram(scenario.text);
    console.log(`   Should Generate: ${analysis.shouldGenerate}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);
    if (analysis.diagramType) {
      console.log(`   Type: ${analysis.diagramType}`);
    }

    results.push({
      scenario: scenario.name,
      shouldGenerate: analysis.shouldGenerate,
      type: analysis.diagramType,
    });
  }

  console.log("\n📊 Summary:\n");
  results.forEach((r) => {
    const emoji = r.shouldGenerate ? "✓" : "✗";
    console.log(`   ${emoji} ${r.scenario}: ${r.shouldGenerate ? r.type : "not recommended"}`);
  });

  return results;
}

// Run all tests
async function runAllTests() {
  console.log("\n🚀 Diagram Generation Test Suite\n");
  console.log("Testing if LLM can generate meaningful Excalidraw diagrams...\n");

  try {
    const result1 = await testBasicDiagramGeneration();
    const result2 = await testStreamingDiagramGeneration();
    const result3 = await testMultipleDiagramTypes();

    console.log("\n\n" + "=".repeat(70));
    console.log("\n🎉 All Tests Completed!\n");

    if (result1 && result1.valid) {
      console.log("✅ Basic diagram generation: PASSED");
      console.log(`   Generated ${result1.elementCount} elements`);
    }

    if (result2 && result2.generated) {
      console.log("✅ Streaming diagram generation: PASSED");
      console.log(`   Generated ${result2.elementCount} elements`);
    }

    if (result3) {
      const recommended = result3.filter((r) => r.shouldGenerate).length;
      console.log(`✅ Diagram type analysis: ${recommended}/${result3.length} scenarios recommended diagrams`);
    }

    console.log("\n💡 Next Steps:");
    console.log("   1. Open the generated .excalidraw files in https://excalidraw.com");
    console.log("   2. Evaluate if the diagrams meaningfully represent the text");
    console.log("   3. Check if elements are positioned logically");
    console.log("   4. Verify that connections/arrows show relationships\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}
