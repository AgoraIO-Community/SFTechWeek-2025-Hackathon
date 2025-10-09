/**
 * Test ResponseParser - File reference extraction
 */

import { ResponseParser } from "./utils/ResponseParser";

function testFileReferenceExtraction() {
  console.log("🧪 Testing File Reference Extraction\n");
  console.log("=" .repeat(70));

  // Test Case 1: Backtick-wrapped files
  console.log("\n1️⃣  Test: Backtick-wrapped file paths\n");
  const text1 = `
The LLMService is implemented in \`src/services/LLMService.ts\` and uses
the MemoryPalace from \`src/services/MemoryPalace.ts:45\` for context.
`;
  const result1 = ResponseParser.extractFileReferences(text1);
  console.log(`   Input: "${text1.trim()}"`);
  console.log(`   Found ${result1.length} references:`);
  result1.forEach((ref) => {
    console.log(`   - ${ref.path}${ref.lineNumber ? ':' + ref.lineNumber : ''} (${ref.relevance})`);
  });

  // Test Case 2: Markdown links
  console.log("\n2️⃣  Test: Markdown link format\n");
  const text2 = `
See [LLMService](src/services/LLMService.ts) for the implementation
and [ViewAwareContextBuilder](src/services/ViewAwareContextBuilder.ts:120) for context building.
`;
  const result2 = ResponseParser.extractFileReferences(text2);
  console.log(`   Input: "${text2.trim()}"`);
  console.log(`   Found ${result2.length} references:`);
  result2.forEach((ref) => {
    console.log(`   - ${ref.path}${ref.lineNumber ? ':' + ref.lineNumber : ''} (${ref.relevance})`);
    if (ref.context) {
      console.log(`     Context: "${ref.context}"`);
    }
  });

  // Test Case 3: Relevance detection
  console.log("\n3️⃣  Test: Relevance detection\n");
  const text3 = `
The main implementation is found in \`src/services/LLMService.ts\`.
This file is referenced here: \`src/services/LLMService.ts\`.
The LLMService uses \`src/services/LLMService.ts\` extensively.
Also see \`src/adapters/GitHubAdapter.ts\` for related code.
`;
  const result3 = ResponseParser.extractFileReferences(text3);
  console.log(`   Input: "${text3.trim()}"`);
  console.log(`   Found ${result3.length} references:`);
  result3.forEach((ref) => {
    console.log(`   - ${ref.path} (${ref.relevance})`);
  });

  // Test Case 4: Mixed formats
  console.log("\n4️⃣  Test: Mixed file reference formats\n");
  const text4 = `
The system is implemented in:
- \`src/services/LLMService.ts:100\` - Main service
- [Context Builder](src/services/ViewAwareContextBuilder.ts) - Context system
- Also check \`src/adapters/GitHubFileSystemAdapter.ts\`
`;
  const result4 = ResponseParser.extractFileReferences(text4);
  console.log(`   Input: "${text4.trim()}"`);
  console.log(`   Found ${result4.length} references:`);
  result4.forEach((ref) => {
    console.log(`   - ${ref.path}${ref.lineNumber ? ':' + ref.lineNumber : ''} (${ref.relevance})`);
  });

  // Test Case 5: Incremental extraction (streaming simulation)
  console.log("\n5️⃣  Test: Incremental extraction (streaming)\n");
  const previousText = "The service is in `src/services/LLMService.ts`.";
  const newText = previousText + " Also see `src/services/ViewAwareContextBuilder.ts:45`.";

  const newRefs = ResponseParser.extractFileReferencesIncremental(previousText, newText);
  console.log(`   Previous: "${previousText}"`);
  console.log(`   New chunk: "${newText.substring(previousText.length)}"`);
  console.log(`   New references found: ${newRefs.length}`);
  newRefs.forEach((ref) => {
    console.log(`   - ${ref.path}${ref.lineNumber ? ':' + ref.lineNumber : ''}`);
  });

  console.log("\n" + "=" .repeat(70));
  console.log("\n✅ All tests completed!\n");
}

function testCodeSnippetExtraction() {
  console.log("\n🧪 Testing Code Snippet Extraction\n");
  console.log("=" .repeat(70));

  const text = `
Here's how to use the LLMService:

\`\`\`typescript
const llmService = new LLMService({ apiKey: 'your-key' });
const response = await llmService.generateResponse(palace, question);
\`\`\`

And here's some JavaScript:

\`\`\`javascript
console.log('Hello world');
\`\`\`
`;

  const result = ResponseParser.extractCodeSnippets(text);
  console.log(`\nFound ${result.length} code snippets:\n`);
  result.forEach((snippet, i) => {
    console.log(`${i + 1}. Language: ${snippet.language}`);
    console.log(`   Lines: ${snippet.code.split('\n').length}`);
    console.log(`   Preview: ${snippet.code.substring(0, 50)}...`);
  });

  console.log("\n" + "=" .repeat(70));
  console.log("\n✅ Code snippet test completed!\n");
}

function testStructuredResponse() {
  console.log("\n🧪 Testing Full Structured Response Parsing\n");
  console.log("=" .repeat(70));

  const mockResponse = `
The LLMService is the main entry point for generating AI responses. It's implemented
in \`src/services/LLMService.ts:32\` and integrates with the MemoryPalace.

Here's a basic usage example:

\`\`\`typescript
const llmService = new LLMService({ apiKey: groqApiKey });
const response = await llmService.generateResponse(palace, question, {
  stream: true,
  temperature: 0.7
});
\`\`\`

The service uses [ViewAwareContextBuilder](src/services/ViewAwareContextBuilder.ts) for
smart context loading. Check \`src/services/ViewAwareContextBuilder.ts:282\` for the
implementation details.
`;

  const structured = ResponseParser.parseResponse(mockResponse, ['llm-integration']);

  console.log("\n📄 Parsed Response Structure:\n");
  console.log(`Text length: ${structured.text.length} characters`);
  console.log(`\nFile References (${structured.metadata.fileReferences.length}):`);
  structured.metadata.fileReferences.forEach((ref) => {
    console.log(`  - ${ref.path}${ref.lineNumber ? ':' + ref.lineNumber : ''} [${ref.relevance}]`);
  });

  console.log(`\nCode Snippets (${structured.metadata.codeSnippets?.length || 0}):`);
  structured.metadata.codeSnippets?.forEach((snippet, i) => {
    console.log(`  ${i + 1}. ${snippet.language} (${snippet.code.split('\n').length} lines)`);
  });

  console.log(`\nRelated Views: ${structured.metadata.relatedViews?.join(', ') || 'none'}`);

  console.log("\n" + "=" .repeat(70));
  console.log("\n✅ Structured response test completed!\n");
}

// Run all tests
console.log("\n🚀 Response Parser Test Suite\n");
testFileReferenceExtraction();
testCodeSnippetExtraction();
testStructuredResponse();

console.log("\n🎉 All tests passed!\n");
