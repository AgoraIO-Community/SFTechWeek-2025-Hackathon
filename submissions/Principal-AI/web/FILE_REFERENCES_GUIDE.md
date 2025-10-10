# File References Feature Guide

## Overview

The chat system now automatically extracts file references from AI responses and displays them with clickable GitHub links!

## ✨ Features

### Automatic Detection
The system detects file references in multiple formats:
- Backtick-wrapped: \`src/services/LLMService.ts\`
- With line numbers: \`src/services/LLMService.ts:45\`
- Markdown links: [LLMService](src/services/LLMService.ts)

### Smart Relevance Classification
Files are categorized by relevance:
- **📌 Primary** (Key Files) - Mentioned multiple times or explicitly referenced
- **📎 Secondary** (Related Files) - Mentioned 2+ times
- **💬 Mentioned** - Mentioned once (collapsed by default)

### GitHub Integration
Each file reference links directly to:
- The file on GitHub
- Specific line numbers when mentioned (e.g., `#L45`)
- Repository: `a24z-ai/core-library` (configurable)

## 🎨 UI Features

### Display Sections
**Key Files** - Most important references, shown first
```
📌 src/services/LLMService.ts:45 →
📌 src/adapters/GitHubAdapter.ts →
```

**Related Files** - Secondary references
```
📎 src/types/Config.ts →
📎 src/utils/Helper.ts →
```

**Also mentioned** - Collapsed by default, expand to see
```
💬 src/index.ts →
💬 src/demo.ts →
```

### Visual Indicators
- **Color-coded borders**: Green (primary), Blue (secondary), Gray (mentioned)
- **Hover effects**: Border highlights and background change
- **Monospace font**: For file paths
- **Truncation**: Long paths are truncated with ellipsis

## 📊 How It Works

### 1. API Streaming
The chat API (`/api/chat`) now:
```javascript
// Extracts file references incrementally during streaming
ResponseParser.extractFileReferencesIncremental(previousText, newText)

// Sends updates to UI
{ type: 'file_references', references: [...] }

// Sends final complete list
{ type: 'file_references_final', references: [...] }
```

### 2. UI Updates
The demo page:
```typescript
// Stores file references per message
interface ConversationMessage {
  content: string;
  fileReferences?: FileReference[]; // ← Added
}

// Updates incrementally as references are found
if (data.type === 'file_references') {
  // Merge new references with existing
}
```

### 3. Component Rendering
```tsx
<FileReferences
  references={message.fileReferences}
  owner="a24z-ai"
  repo="core-library"
  branch="main"
/>
```

## 🧪 Testing

### Ask Questions That Reference Files
Try these questions to see file references in action:

**Implementation questions:**
- "How does the LLMService work?"
- "Show me the ViewAwareContextBuilder implementation"
- "Where is the GitHubAdapter defined?"

**Architectural questions:**
- "What files are involved in context building?"
- "Explain the adapter pattern used here"

**Code review questions:**
- "Review the implementation in src/services/LLMService.ts"
- "What does src/adapters/GitHubFileSystemAdapter.ts do?"

### Expected Behavior

1. **During streaming**: File references appear as they're detected
2. **After completion**: Final complete list is displayed
3. **Multiple mentions**: Files mentioned multiple times show as "Primary"
4. **Line numbers**: Preserved when mentioned (e.g., `:45`)

## 🔧 Configuration

### Change GitHub Repository
Edit the `FileReferences` component props:
```tsx
<FileReferences
  references={message.fileReferences}
  owner="your-org"        // ← Change
  repo="your-repo"        // ← Change
  branch="main"           // ← Or "master", etc.
/>
```

### Customize Relevance Rules
In `ResponseParser.ts`, adjust detection logic:
```typescript
private static determineRelevance(text, filePath, position) {
  // Add your own indicators
  const primaryIndicators = [
    'implemented in',
    'see',
    'defined in',
    'your custom phrase', // ← Add yours
  ];
}
```

## 📁 Files Added/Modified

### New Files
- `/src/components/FileReferences.tsx` - Display component
- `/FILE_REFERENCES_GUIDE.md` - This file

### Modified Files
- `/src/app/api/chat/route.js` - Added ResponseParser integration
- `/src/app/demo/page.tsx` - Added file reference handling and display

### Using v0.3.1 Package
- `ResponseParser` - From `@principal-ade/ai-brain`
- `FileReference` type - Exported interface

## 🎯 Example Output

When the AI says:
```
The LLMService is implemented in `src/services/LLMService.ts:32` and
integrates with the ViewAwareContextBuilder found in
`src/services/ViewAwareContextBuilder.ts`.
```

You'll see:
```
📁 Referenced Files (2)

Key Files
📌 src/services/LLMService.ts:32           →
📌 src/services/ViewAwareContextBuilder.ts →
```

Click any file to open it on GitHub!

## 💡 Tips

### For Better Results
1. **Ask specific questions** - "How does X work?" vs "Tell me about the code"
2. **Mention file paths** - AI will reference them with proper formatting
3. **Ask for implementations** - Questions about "how" trigger code references

### Relevance Indicators
The AI learns to use phrases like:
- "implemented in `file.ts`"
- "see `file.ts` for details"
- "defined in `file.ts:100`"

These automatically mark files as "primary" (key files).

## 🚀 Future Enhancements

Potential improvements:
- [ ] Syntax highlighting for code snippets
- [ ] Inline file preview (hover tooltip)
- [ ] Local file navigation (if codebase is cloned)
- [ ] File diff views for comparing versions
- [ ] Auto-linking between related files

## 📝 Technical Details

### Extraction Patterns
```typescript
// Backtick pattern
/`([a-zA-Z0-9_\-./]+\.(ts|tsx|js|jsx|py|java))(?::(\d+))?`/g

// Markdown link pattern
/\[([^\]]+)\]\(([a-zA-Z0-9_\-./]+\.(ts|tsx))(?::(\d+))?\)/g
```

### Supported File Extensions
- TypeScript: `.ts`, `.tsx`
- JavaScript: `.js`, `.jsx`
- Python: `.py`
- Java: `.java`
- Go: `.go`
- Rust: `.rs`
- C/C++: `.cpp`, `.c`, `.h`

### GitHub URL Format
```
https://github.com/{owner}/{repo}/blob/{branch}/{path}#L{lineNumber}
```

---

**Happy exploring!** 🎉 Now you can click directly from AI responses to the actual code on GitHub.
