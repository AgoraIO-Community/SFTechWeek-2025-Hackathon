# Migration Guide: @principal-ade/ai-brain v0.2.0 → v0.3.1

## Overview

This guide documents the upgrade from `@principal-ade/ai-brain` version 0.2.0 to 0.3.1, which introduces a two-stage view-aware context system for improved response quality and reduced token usage.

## ✅ Completed Steps

1. **Updated package.json**: Changed dependency from `^0.2.0` to `^0.3.1`
2. **Installed dependencies**: Ran `npm install` to get v0.3.1 from npm
3. **Created parallel route**: Added `/api/chat-v3` alongside existing `/api/chat`
4. **Created test script**: `test-chat-versions.sh` for comparing both versions

## 🔄 What Changed

### No Breaking Changes!
All existing code continues to work. The new features are **additive**.

### New Features in v0.3.1

1. **View-Aware Context Builder**
   - Analyzes question intent (overview, implementation, usage, comparison)
   - Loads only relevant context (40-50% token reduction)
   - Better response accuracy

2. **New Method: `generateViewAwareResponse()`**
   ```javascript
   const { response, intent } = await llmService.generateViewAwareResponse(
     palace,
     fsAdapter,  // ← New required parameter
     message,
     conversationHistory,
     { stream: true }
   );
   ```

3. **Intent Metadata**
   - Returns intent type (overview/implementation/usage/comparison)
   - Shows which views were referenced
   - Reports how many files were loaded

## 📁 File Changes

### Created Files
- `/src/app/api/chat-v3/route.js` - New v0.3.1 implementation
- `/test-chat-versions.sh` - Testing script
- `/MIGRATION_V3_GUIDE.md` - This file

### Modified Files
- `/package.json` - Updated dependency to v0.3.1
- `/package-lock.json` - Updated lock file

### Unchanged Files (Still work as-is)
- `/src/app/api/chat/route.js` - Original v0.2.0 implementation
- `/src/app/api/load-repo/route.js` - No changes needed

## 🧪 Testing

### Run the Development Server
```bash
npm run dev
```

### Test Both Versions
```bash
# Make sure the server is running first
./test-chat-versions.sh
```

The script will test both endpoints with different question types and show the responses side-by-side.

### Manual Testing with curl

**Test v0.2.0 (Original):**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this codebase about?",
    "conversationHistory": [],
    "sessionId": "test-123"
  }'
```

**Test v0.3.1 (New):**
```bash
curl -X POST http://localhost:3000/api/chat-v3 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is this codebase about?",
    "conversationHistory": [],
    "sessionId": "test-123"
  }'
```

## 📊 Expected Improvements

### Token Usage Reduction
| Question Type | v0.2.0 | v0.3.1 | Savings |
|--------------|--------|--------|---------|
| Overview | 5-8KB | 2-3KB | -40% |
| Implementation | 5-8KB | 4-6KB | -20% |
| Usage | 5-8KB | 3-4KB | -30% |
| Comparison | 5-8KB | 4-6KB | -20% |

### Response Quality
- **Overview questions**: Same or better (more focused)
- **Implementation questions**: Much better (includes actual code)
- **Usage questions**: Better (practical examples)
- **Comparison questions**: Much better (side-by-side analysis)

## 🚀 Next Steps

### Option 1: Gradual Migration (Recommended)
1. Keep both endpoints running
2. A/B test with real users
3. Monitor performance metrics
4. Switch default to v3 when confident
5. Eventually deprecate v2

### Option 2: Immediate Migration
1. Update `/src/app/api/chat/route.js` with v3 code
2. Test thoroughly
3. Deploy

### Option 3: Feature Flag
Add a toggle in your UI or environment variable:
```javascript
const useV3 = process.env.USE_CHAT_V3 === 'true';
const endpoint = useV3 ? '/api/chat-v3' : '/api/chat';
```

## 📝 Code Comparison

### v0.2.0 (Current)
```javascript
const responseGenerator = llmService.generateConversationStreamingResponse(
  palace,
  message,
  conversationHistory,
  { temperature: 0.7, maxTokens: 2000 }
);

for await (const chunk of responseGenerator) {
  // Stream chunk
}
```

### v0.3.1 (New)
```javascript
const { response, intent } = await llmService.generateViewAwareResponse(
  palace,
  fsAdapter,  // ← Add this
  message,
  conversationHistory,
  { temperature: 0.7, maxTokens: 2000, stream: true }
);

// Optional: Use intent metadata
console.log(`Question type: ${intent.type}`);
console.log(`Views used: ${intent.relevantViews.join(', ')}`);

for await (const chunk of response) {
  // Stream chunk
}
```

## ⚠️ Important Notes

1. **fsAdapter Required**: The new method requires `fsAdapter` as a parameter
2. **Stream Option**: Set `stream: true` in options for streaming responses
3. **Intent Object**: Response now includes intent metadata (optional to use)
4. **Backward Compatible**: Old methods still work, no rush to migrate

## 🐛 Troubleshooting

### Issue: "fsAdapter is not defined"
**Solution**: Make sure you're passing the cached `fsAdapter` from `adapterCache.get(cacheKey)`

### Issue: Response format different
**Solution**: The v3 endpoint sends a metadata chunk first. Update client to handle it or filter it out.

### Issue: Slower responses
**Solution**: First request loads the repository. Subsequent requests use cache and should be faster.

## 📚 Resources

- [Full v0.3.0 Release Notes](/packages/core/WHATS_NEW_v0.3.0.md)
- [Two-Stage Implementation Details](/packages/core/TWO_STAGE_IMPLEMENTATION.md)
- [npm Package](https://www.npmjs.com/package/@principal-ade/ai-brain)

## ✅ Migration Checklist

- [x] Update package.json to v0.3.1
- [x] Run npm install
- [x] Create parallel test route
- [x] Create test script
- [ ] Run tests and compare results
- [ ] Test with real voice avatar integration
- [ ] Monitor token usage
- [ ] Decide on migration strategy
- [ ] Update production code
- [ ] Deploy

---

**Migration Date**: $(date)
**Updated By**: Claude Code Assistant
**Status**: Ready for testing
