# Diagram Generation & Metadata Integration Guide

This document explains how to integrate the **DiagramGenerator** and **ResponseParser** services into the Principal AI web application to provide real-time visual diagrams and file reference extraction.

## Overview

The system now supports two powerful features:

1. **Automatic Diagram Generation**: LLM analyzes response text and generates Excalidraw diagrams when beneficial
2. **File Reference Extraction**: Automatically extracts and links to file paths mentioned in responses

Both features work seamlessly with the existing streaming response system.

---

## Architecture

### Current Flow (Text Only)

```
User Question → /api/chat → LLMService.generateStreamingResponse()
                              ↓
                         Stream chunks to client
                              ↓
                    Update UI + Send to TTS
```

### Enhanced Flow (Text + Diagrams + Metadata)

```
User Question → /api/chat → LLMService.generateStreamingResponse()
                              ↓
                         Accumulate text chunks
                              ↓
                    ┌────────┴────────┐
                    ↓                  ↓
            Stream text          After threshold reached
            to client            (e.g., 500 chars or 2s delay)
                    ↓                  ↓
            Update UI        DiagramGenerator.shouldGenerateDiagram()
                    ↓                  ↓
            Send to TTS           Generate if beneficial
                                      ↓
                              DiagramGenerator.generateDiagram()
                                      ↓
                              Return Excalidraw JSON
                                      ↓
                              Send to client as separate message
                                      ↓
                              Render in Excalidraw component

            After streaming complete
                    ↓
            ResponseParser.parseResponse()
                    ↓
            Extract file references
                    ↓
            Send metadata to client
                    ↓
            Render as clickable links
```

---

## Backend Integration

### 1. Update API Route (`/api/chat/route.js`)

Add the new imports:

```javascript
import {
  GitHubFileSystemAdapter,
  LLMService,
  DiagramGenerator,      // New
  ResponseParser         // New
} from "@principal-ade/ai-brain";
```

Update the streaming handler:

```javascript
export async function POST(request) {
  // ... existing setup code ...

  const llmService = new LLMService({ apiKey: groqApiKey });
  const diagramGenerator = new DiagramGenerator(groqApiKey);

  const stream = new ReadableStream({
    async start(controller) {
      let accumulatedText = "";
      let diagramSent = false;

      try {
        const responseGenerator = llmService.generateConversationStreamingResponse(
          palace,
          message,
          conversationHistory,
          { temperature: 0.7, maxTokens: 2000 }
        );

        // Stream text chunks
        for await (const chunk of responseGenerator) {
          accumulatedText += chunk;

          // Send text chunk to client
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'text',
            content: chunk
          }) + '\n'));

          // Trigger diagram generation after threshold
          if (!diagramSent && accumulatedText.length > 500) {
            // Generate diagram in background (non-blocking)
            diagramGenerator.generateDiagramFromStream(accumulatedText)
              .then(diagram => {
                if (diagram) {
                  console.log('Generated diagram with', diagram.elements.length, 'elements');
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: 'diagram',
                    data: diagram
                  }) + '\n'));
                }
              })
              .catch(err => {
                console.error('Diagram generation error:', err);
                // Don't fail the whole request if diagram generation fails
              });

            diagramSent = true;
          }
        }

        // Parse response for file references
        const structured = ResponseParser.parseResponse(accumulatedText);

        // Send metadata
        if (structured.metadata.fileReferences.length > 0) {
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'metadata',
            fileReferences: structured.metadata.fileReferences,
            codeSnippets: structured.metadata.codeSnippets
          }) + '\n'));
        }

        // Send completion signal
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
        controller.close();

      } catch (error) {
        console.error("Streaming error:", error);
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

---

## Frontend Integration

### 1. Install Dependencies

```bash
npm install @excalidraw/excalidraw
```

### 2. Update Types (`page.tsx`)

Add new types for the enhanced messages:

```typescript
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";

interface ExcalidrawScene {
  type: "excalidraw";
  version: number;
  source: string;
  elements: ExcalidrawElement[];
  appState: {
    gridSize: number | null;
    viewBackgroundColor: string;
  };
}

interface FileReference {
  path: string;
  lineNumber?: number;
  relevance: 'primary' | 'secondary' | 'mentioned';
  context?: string;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  diagram?: ExcalidrawScene;        // New
  fileReferences?: FileReference[];  // New
}
```

### 3. Add State Variables

```typescript
const [currentDiagram, setCurrentDiagram] = useState<ExcalidrawScene | null>(null);
const [currentFileRefs, setCurrentFileRefs] = useState<FileReference[]>([]);
```

### 4. Update Message Handling

Modify the `handleSendMessage` function to parse different message types:

```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n').filter((line) => line.trim());

  for (const line of lines) {
    try {
      const data = JSON.parse(line);

      if (data.type === 'text' && data.content) {
        // Handle text chunk (existing logic)
        accumulatedContent += data.content;

        // Send to TTS if enabled
        if (ttsStarted) {
          sendTextChunk(data.content);
        }

        // Update conversation history
        setConversationHistory((prev) => {
          const updated = [...prev];
          updated[assistantMessageIndex] = {
            role: "assistant",
            content: accumulatedContent,
            timestamp: new Date(),
          };
          return updated;
        });
      }

      else if (data.type === 'diagram') {
        // Received diagram!
        console.log('Received diagram with', data.data.elements.length, 'elements');
        setCurrentDiagram(data.data);

        // Attach to current message
        setConversationHistory((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].diagram = data.data;
          }
          return updated;
        });
      }

      else if (data.type === 'metadata') {
        // Received file references
        console.log('Received', data.fileReferences.length, 'file references');
        setCurrentFileRefs(data.fileReferences);

        // Attach to current message
        setConversationHistory((prev) => {
          const updated = [...prev];
          if (updated[assistantMessageIndex]) {
            updated[assistantMessageIndex].fileReferences = data.fileReferences;
          }
          return updated;
        });
      }

      else if (data.done) {
        break;
      }

    } catch (e) {
      console.error("Error parsing stream chunk:", e);
    }
  }
}
```

### 5. Add Excalidraw Component

Import Excalidraw at the top:

```typescript
import { Excalidraw } from "@excalidraw/excalidraw";
```

Add the diagram panel below your conversation panels:

```tsx
{/* Diagram Panel - Only show when diagram is available */}
{currentDiagram && (
  <div
    style={{
      backgroundColor: theme.colors.backgroundSecondary,
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
      gridColumn: "1 / -1", // Span full width in grid
      marginTop: "1.5rem",
    }}
  >
    <h3
      style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        marginBottom: "1rem",
      }}
    >
      📊 Visual Diagram
    </h3>

    <div
      style={{
        height: "500px",
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <Excalidraw
        initialData={{
          elements: currentDiagram.elements,
          appState: currentDiagram.appState,
        }}
        viewModeEnabled={true} // Read-only mode
        theme={theme.mode === "dark" ? "dark" : "light"}
      />
    </div>

    <p
      style={{
        marginTop: "0.75rem",
        fontSize: "0.85rem",
        color: theme.colors.textSecondary,
      }}
    >
      This diagram was automatically generated based on the AI's response.
    </p>
  </div>
)}
```

### 6. Add File References Panel

```tsx
{/* File References Panel */}
{currentFileRefs.length > 0 && (
  <div
    style={{
      backgroundColor: theme.colors.backgroundSecondary,
      padding: "1.5rem",
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
      gridColumn: "1 / -1",
      marginTop: "1.5rem",
    }}
  >
    <h3
      style={{
        fontSize: "1.25rem",
        fontWeight: "600",
        marginBottom: "1rem",
      }}
    >
      📁 Referenced Files
    </h3>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}
    >
      {currentFileRefs.map((ref, i) => {
        const relevanceColors = {
          primary: "#3b82f6",
          secondary: "#10b981",
          mentioned: "#6b7280",
        };

        return (
          <a
            key={i}
            href={`https://github.com/a24z-ai/core-library/blob/main/${ref.path}${ref.lineNumber ? `#L${ref.lineNumber}` : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem",
              borderRadius: "6px",
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`,
              textDecoration: "none",
              color: theme.colors.text,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.colors.primary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>📄</span>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: theme.fonts.monospace,
                  fontSize: "0.9rem",
                  marginBottom: "0.25rem",
                }}
              >
                {ref.path}{ref.lineNumber && `:${ref.lineNumber}`}
              </div>

              {ref.context && (
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {ref.context}
                </div>
              )}
            </div>

            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                backgroundColor: relevanceColors[ref.relevance],
                color: "white",
                fontWeight: "500",
              }}
            >
              {ref.relevance}
            </span>

            <span style={{ fontSize: "1.25rem" }}>→</span>
          </a>
        );
      })}
    </div>
  </div>
)}
```

---

## Configuration Options

### Diagram Generation Timing

You can adjust when diagrams are generated:

**Option A: Character Threshold** (Recommended)
```javascript
if (!diagramSent && accumulatedText.length > 500) {
  // Generate after 500 characters
}
```

**Option B: Time-based Delay**
```javascript
if (!diagramSent) {
  setTimeout(() => {
    diagramGenerator.generateDiagramFromStream(accumulatedText)
      .then(/* ... */);
  }, 2000); // Wait 2 seconds
  diagramSent = true;
}
```

**Option C: After Complete Response**
```javascript
// After the streaming loop
const diagram = await diagramGenerator.generateDiagramFromStream(accumulatedText);
if (diagram) {
  controller.enqueue(/* ... */);
}
```

### Diagram Analysis Control

The `DiagramGenerator` automatically decides if a diagram is beneficial:

```javascript
// Manual control
const analysis = await diagramGenerator.shouldGenerateDiagram(text);

if (analysis.shouldGenerate) {
  console.log('Diagram type:', analysis.diagramType); // architecture, flow, relationship, sequence
  console.log('Reasoning:', analysis.reasoning);

  const diagram = await diagramGenerator.generateDiagram(text);
}
```

---

## Testing

### Test Diagram Generation

Run the test suite in the core package:

```bash
cd packages/core
GROQ_API_KEY="your-key" GITHUB_TOKEN="your-token" bun run src/test-diagram-generation.ts
```

This will:
1. Generate diagrams from sample text
2. Test streaming diagram generation
3. Validate diagram quality
4. Output `.excalidraw` files you can inspect

### Test File Reference Extraction

```bash
cd packages/core
bun run src/test-response-parser.ts
```

### Manual Testing in Browser

1. Load the demo page
2. Ask architectural questions like:
   - "How does the LLMService work?"
   - "Explain the MemoryPalace architecture"
   - "What's the relationship between the adapters and services?"
3. Watch for:
   - Diagram appearing below conversation (if applicable)
   - File references appearing as clickable links
   - Proper styling and theming

---

## Performance Considerations

### Diagram Generation
- **Non-blocking**: Runs in background, doesn't slow streaming
- **Conditional**: Only generates when beneficial (smart analysis)
- **Cached**: Diagram sent once per response
- **Timeout**: Consider adding timeout for diagram generation:

```javascript
Promise.race([
  diagramGenerator.generateDiagramFromStream(text),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 10000)
  )
]).then(/* ... */).catch(/* ... */);
```

### File Reference Parsing
- **Lightweight**: Regex-based, very fast
- **Post-process**: Runs after streaming completes
- **No external calls**: Pure parsing, no API calls

---

## Error Handling

```javascript
// In API route
diagramGenerator.generateDiagramFromStream(accumulatedText)
  .then(diagram => {
    if (diagram) {
      controller.enqueue(/* ... */);
    }
  })
  .catch(err => {
    console.error('Diagram generation failed:', err);
    // Don't fail the whole request
    // User still gets text response
  });
```

```javascript
// In frontend
try {
  const data = JSON.parse(line);
  // Handle different types
} catch (e) {
  console.error("Parse error:", e);
  // Continue processing other chunks
}
```

---

## Future Enhancements

### Diagram Editing
Allow users to edit generated diagrams:

```tsx
<Excalidraw
  viewModeEnabled={false}  // Enable editing
  onChange={(elements, appState) => {
    // Save user modifications
  }}
/>
```

### Diagram Export
Add export buttons for different formats:

```tsx
<button onClick={() => exportToSVG(currentDiagram)}>
  Export as SVG
</button>
```

### Multiple Diagrams
Support multiple diagrams per response:

```typescript
interface ConversationMessage {
  diagrams: ExcalidrawScene[];  // Array instead of single
}
```

### Real-time Diagram Updates
Update diagram as text streams in:

```javascript
// Generate incremental diagrams
if (accumulatedText.length > 500 && !diagramSent) {
  // First diagram
}
if (accumulatedText.length > 1500 && diagramSent) {
  // Updated diagram with more detail
}
```

---

## Troubleshooting

### Diagram Not Appearing

**Check console logs:**
```javascript
console.log('Diagram data received:', data);
```

**Verify Excalidraw import:**
```typescript
import { Excalidraw } from "@excalidraw/excalidraw";
```

**Check element structure:**
```javascript
if (data.data?.elements?.length > 0) {
  console.log('Valid diagram with', data.data.elements.length, 'elements');
}
```

### File References Not Linking

**Verify parser output:**
```javascript
const refs = ResponseParser.extractFileReferences(text);
console.log('Found references:', refs);
```

**Check GitHub URL format:**
```
https://github.com/{owner}/{repo}/blob/{branch}/{path}#L{lineNumber}
```

### Streaming Issues

**Check message format:**
```javascript
// Ensure newline-delimited JSON
JSON.stringify({ type: 'text', content: chunk }) + '\n'
```

**Verify encoding:**
```javascript
const encoder = new TextEncoder();
controller.enqueue(encoder.encode(message));
```

---

## API Reference

### DiagramGenerator

```typescript
class DiagramGenerator {
  constructor(apiKey: string, model?: string)

  // Check if text would benefit from diagram
  async shouldGenerateDiagram(text: string): Promise<{
    shouldGenerate: boolean;
    reasoning: string;
    diagramType?: "architecture" | "flow" | "relationship" | "sequence";
  }>

  // Generate diagram from text
  async generateDiagram(
    text: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ExcalidrawScene>

  // Generate from streaming text (returns null if text too short or not beneficial)
  async generateDiagramFromStream(
    accumulatedText: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<ExcalidrawScene | null>
}
```

### ResponseParser

```typescript
class ResponseParser {
  // Parse complete response
  static parseResponse(
    text: string,
    relatedViews?: string[]
  ): StructuredResponse

  // Extract file references
  static extractFileReferences(text: string): FileReference[]

  // Extract code snippets
  static extractCodeSnippets(text: string): Array<{
    language: string;
    code: string;
    description?: string;
  }>

  // Incremental extraction for streaming
  static extractFileReferencesIncremental(
    previousText: string,
    newText: string
  ): FileReference[]
}
```

---

## Example Response Format

Complete API response stream:

```json
{"type":"text","content":"The LLMService is "}
{"type":"text","content":"the main component that "}
{"type":"text","content":"handles AI responses..."}
{"type":"diagram","data":{"type":"excalidraw","version":2,"elements":[...]}}
{"type":"text","content":"implemented in "}
{"type":"text","content":"`src/services/LLMService.ts`"}
{"type":"metadata","fileReferences":[{"path":"src/services/LLMService.ts","lineNumber":32,"relevance":"primary"}]}
{"done":true}
```

---

## Summary

This integration provides:
- ✅ **Automatic visual diagrams** for complex explanations
- ✅ **Clickable file references** for easy navigation
- ✅ **Non-blocking generation** maintains streaming performance
- ✅ **Smart analysis** only generates when beneficial
- ✅ **Rich metadata** enhances user experience

The system seamlessly enhances the existing conversation flow without disrupting the core streaming and TTS functionality.
