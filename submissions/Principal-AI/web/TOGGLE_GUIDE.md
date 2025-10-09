# API Version Toggle - User Guide

## What's New

You now have a toggle in the demo UI to switch between v0.2.0 and v0.3.1 of the chat API!

## How to Use

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Open the Demo Page
Navigate to `http://localhost:3000/demo`

### 3. Find the Toggle
After loading a repository, look for the **Feature Toggles** section at the top of the interface. You'll see:

- ☑️ **Enable Avatar** - Toggle HeyGen avatar on/off
- ☑️ **Using v0.2.0 (Legacy)** / **Using v0.3.1 (View-Aware)** - Switch API versions

### 4. Toggle Between Versions

**v0.2.0 (Legacy)** - Blue badge
- Original implementation
- Loads all context for every question
- Consistent but less optimized

**v0.3.1 (View-Aware)** - Green badge
- New two-stage implementation
- Smart context loading based on question type
- Shows metadata about the response

## Visual Indicators

### Toggle Appearance
- **Blue border + background**: v0.2.0 active
- **Green border + background**: v0.3.1 active
- Icon changes: 📦 (v0.2.0) → 🚀 (v0.3.1)

### Metadata Display (v0.3.1 only)
When using v0.3.1, you'll see a green info box showing:
```
🚀 v0.3.1 View-Aware Response
Type: overview • Views: 2 • Files: 0
```

This tells you:
- **Type**: Question classification (overview/implementation/usage/comparison)
- **Views**: Number of codebase views referenced
- **Files**: Number of source files loaded

## Testing Comparison

### Try These Questions

**For Overview (v0.3.1 should load fewer files):**
- "What is this codebase about?"
- "What's the architecture?"

**For Implementation (v0.3.1 should load source code):**
- "How does the GitHubAdapter work?"
- "Show me how the prefetch method works"

**For Usage:**
- "How do I use the MemoryPalace API?"
- "Give me an example of loading a repository"

**For Comparison:**
- "What's the difference between MemoryPalace and GitHubAdapter?"

### What to Compare

1. **Response Quality**
   - Toggle to v0.2.0, ask a question, note the response
   - Toggle to v0.3.1, ask the same question
   - Compare accuracy and detail level

2. **Metadata (v0.3.1 only)**
   - Check the question type classification
   - See how many views/files were loaded
   - Notice token usage differences

3. **Response Speed**
   - Overview questions should be faster with v0.3.1
   - Implementation questions might load more content

## Console Logging

Open your browser's developer console to see:
```javascript
Using API endpoint: /api/chat-v3
📊 V3 API Metadata: { type: "overview", relevantViews: [...], filesLoaded: 0 }
```

## Quick Comparison Chart

| Feature | v0.2.0 | v0.3.1 |
|---------|--------|--------|
| Endpoint | `/api/chat` | `/api/chat-v3` |
| Context Loading | All views | Smart/selective |
| Token Usage | ~5-8KB | ~2-6KB |
| Question Types | Generic | 4+ types |
| Metadata | None | Type, Views, Files |
| Visual Badge | 📦 Blue | 🚀 Green |

## Troubleshooting

### Toggle not working?
- Check browser console for errors
- Ensure both API routes exist (`/api/chat` and `/api/chat-v3`)
- Verify package version: should be `@principal-ade/ai-brain@0.3.1`

### No metadata showing?
- Make sure the toggle is set to v0.3.1 (green)
- Check console for the metadata log
- Metadata appears after the first question

### Different responses?
- This is expected! v0.3.1 uses different context
- v0.3.1 might include code snippets for implementation questions
- v0.3.1 might be more concise for overview questions

## Files Modified

- `/src/app/demo/page.tsx` - Added toggle UI and logic
- `/src/app/api/chat-v3/route.js` - New v0.3.1 endpoint
- `/package.json` - Updated to v0.3.1

## Next Steps

1. Test both versions with different question types
2. Compare response quality and speed
3. Check metadata to understand context loading
4. Decide which version works better for your use case
5. Consider making v0.3.1 the default when ready

---

**Happy Testing!** 🚀
