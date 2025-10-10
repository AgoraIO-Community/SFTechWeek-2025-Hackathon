# Demo Question Evaluation System

## Overview

Automated evaluation framework to verify consistency and quality of responses for demo questions. Ensures the voice avatar provides high-quality, consistent answers across multiple runs.

## What It Tests

### 1. Intent Classification (20 points)
- Verifies question type is correctly identified
- Expected types: overview, implementation, usage, comparison

### 2. Response Length (15 points)
- Checks minimum length (substance)
- Checks maximum length (voice-friendliness)
- Prevents too-short or too-long responses

### 3. Required Keywords (25 points)
- Ensures critical terms appear in response
- Validates technical accuracy

### 4. Forbidden Keywords (10 points)
- Ensures inappropriate terms don't appear
- Prevents off-topic responses

### 5. File References (15 points)
- Checks if implementation questions cite specific files
- Validates code references

### 6. Voice Friendliness (15 points)
- Checks for natural language
- Ensures structured format (numbered lists, etc.)
- Limits code blocks for TTS suitability

**Total: 100 points**
**Passing Score: ≥70**

## Demo Question Set

### Overview Questions (2)
1. "What is this codebase about?"
2. "Explain the architecture of this project"

**Success Criteria:**
- Must include key terms
- 50-300 words
- Voice-friendly format

### Implementation Questions (3)
1. "How does the MemoryPalace class work?"
2. "Show me how the GitHubAdapter fetches files"
3. "How does the prefetchAlexandriaFiles method work?"

**Success Criteria:**
- Must reference specific files
- 100+ words
- Technical accuracy

### Usage Questions (3)
1. "How do I use the MemoryPalace API?"
2. "How do I get started with this library?"
3. "Give me an example of loading a repository"

**Success Criteria:**
- Must include usage terms
- 80-400 words
- Voice-friendly
- Actionable guidance

### Comparison Questions (2)
1. "What's the difference between getView and listViews?"
2. "When should I use GitHubAdapter vs GitHubGlobAdapter?"

**Success Criteria:**
- Must mention both options
- 80-400 words
- Voice-friendly
- Balanced comparison

**Total: 10 questions**

## Running Evals

### Setup

```bash
cd packages/core

# Set environment variables
export GITHUB_TOKEN=your_token
export GROQ_API_KEY=your_key

# Build
npm run build
```

### Run Evaluation

```bash
# Run full evaluation
node dist/eval-demo.js

# Results will be:
# 1. Printed to console
# 2. Saved to eval-results.json
```

### Expected Output

```
🧪 Starting Demo Question Evaluation

📋 Total questions: 10

────────────────────────────────────────────────────────────────────────────────
[1/10] Overview: overview-1
Q: "What is this codebase about?"
────────────────────────────────────────────────────────────────────────────────

✓ Intent: overview ✅
✓ Response Length: 142 words
✓ Score: 95/100

[... continues for all 10 questions ...]

════════════════════════════════════════════════════════════════════════════════
📊 EVALUATION SUMMARY
════════════════════════════════════════════════════════════════════════════════

Total Questions: 10
Passed (≥70): 9 ✅
Failed (<70): 1 ❌

Average Score: 87.5/100
Intent Accuracy: 90.0%

────────────────────────────────────────────────────────────────────────────────
Breakdown by Category:
────────────────────────────────────────────────────────────────────────────────

Overview:
  Questions: 2
  Passed: 2/2
  Avg Score: 92.5/100

Implementation:
  Questions: 3
  Passed: 3/3
  Avg Score: 85.0/100

Usage:
  Questions: 3
  Passed: 3/3
  Avg Score: 88.3/100

Comparison:
  Questions: 2
  Passed: 1/2
  Avg Score: 82.5/100

💾 Results saved to: eval-results.json
```

## Evaluation Metrics Explained

### Intent Correct (20 points)
```
✅ Pass: Detected intent matches expected
❌ Fail: Intent mismatch
```

### Response Length (15 points)
```
✅ Pass: Within min/max bounds
❌ Fail: Too short or too long

Example:
- Overview: 50-300 words (voice-friendly)
- Implementation: 100+ words (detailed)
```

### Includes Required (25 points)
```
✅ Pass: All required keywords present
❌ Fail: Missing keywords

Example:
Question: "What is this codebase about?"
Required: ["memory", "palace", "codebase"]
```

### Excludes Forbidden (10 points)
```
✅ Pass: No forbidden keywords
❌ Fail: Forbidden keywords found
```

### References Files (15 points)
```
✅ Pass: Cites specific files (for implementation questions)
❌ Fail: No file references when expected

Example patterns:
- src/services/LLMService.ts
- .alexandria/views/architecture.md
```

### Voice Friendly (15 points)
```
✅ Pass: Natural language + structure
❌ Fail: Too many code blocks or unstructured

Checks:
- Not too many code blocks (≤2)
- Has natural language indicators
- Has clear structure (lists, steps)
```

## Result Interpretation

### Passing (Score ≥ 70)
- Question type correctly identified
- Response meets quality criteria
- Suitable for demo

### Failing (Score < 70)
- Review issues list
- Common problems:
  - Intent misclassification
  - Missing required keywords
  - Response too short/long
  - Not voice-friendly

## Using Results for Demo Prep

### 1. Identify Best Questions
```bash
# Look for high-scoring questions (≥90)
# These are safest for live demo
```

### 2. Fix Failing Questions
```bash
# For questions scoring <70:
# - Check intent detection
# - Review success criteria
# - Adjust question wording if needed
```

### 3. Verify Consistency
```bash
# Run evals multiple times
# Ensure scores stay consistent (±5 points)

node dist/eval-demo.js > run1.txt
node dist/eval-demo.js > run2.txt
node dist/eval-demo.js > run3.txt

# Compare results
```

### 4. Select Demo Questions
```bash
# Recommended approach:
# - Pick 1-2 from each category
# - Choose highest-scoring questions
# - Ensure variety (overview, implementation, usage, comparison)
```

## Sample eval-results.json

```json
{
  "totalQuestions": 10,
  "passedQuestions": 9,
  "failedQuestions": 1,
  "averageScore": 87.5,
  "intentAccuracy": 90.0,
  "results": [
    {
      "question": {
        "id": "overview-1",
        "category": "Overview",
        "question": "What is this codebase about?",
        "expectedIntent": "overview"
      },
      "intent": {
        "type": "overview",
        "confidence": 0.7,
        "relevantViews": ["architecture-view"],
        "relevantFiles": [],
        "keywords": ["codebase", "about"]
      },
      "response": "This codebase is the a24z Memory Palace...",
      "metrics": {
        "intentCorrect": true,
        "responseLength": 142,
        "includesRequired": true,
        "excludesForbidden": true,
        "referencesFiles": false,
        "voiceFriendly": true,
        "overallScore": 95
      },
      "issues": []
    }
    // ... more results
  ]
}
```

## Customizing Eval Criteria

### Add New Questions

Edit `src/eval-demo.ts`:

```typescript
const DEMO_QUESTIONS: DemoQuestion[] = [
  // ... existing questions

  // Add your question
  {
    id: "custom-1",
    category: "Custom",
    question: "Your question here?",
    expectedIntent: "implementation",
    successCriteria: {
      mustInclude: ["keyword1", "keyword2"],
      minLength: 100,
      shouldReferenceFiles: true
    }
  }
];
```

### Adjust Scoring

Modify scoring weights in `evaluateResponse()`:

```typescript
// Current weights:
// Intent: 20 points
// Length: 15 points
// Keywords: 25 points
// Forbidden: 10 points
// Files: 15 points
// Voice: 15 points

// Adjust as needed for your demo priorities
```

## CI/CD Integration

### Pre-Commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

npm run build
node dist/eval-demo.js

# Check if average score is acceptable
# Fail commit if score drops below threshold
```

### GitHub Actions

```yaml
name: Eval Demo Questions

on: [push, pull_request]

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm run build
      - run: node dist/eval-demo.js
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
      - uses: actions/upload-artifact@v2
        with:
          name: eval-results
          path: eval-results.json
```

## Troubleshooting

### Issue: Low Intent Accuracy

**Solution:**
- Review question wording
- Check if keywords trigger wrong intent
- Adjust intent detection patterns in ViewAwareContextBuilder

### Issue: Responses Too Long

**Solution:**
- Adjust maxLength in success criteria
- Review LLM prompt for verbosity
- Consider adjusting temperature parameter

### Issue: Missing File References

**Solution:**
- Verify view reference groups are loaded
- Check if files exist in repository
- Review file discovery algorithm

### Issue: Not Voice Friendly

**Solution:**
- Adjust intent-specific prompts
- Emphasize "clear, natural language" in prompts
- Limit code block generation

## Best Practices

### 1. Run Evals Before Demo
```bash
# Always run evals before presenting
# Verify 90%+ pass rate
```

### 2. Test Edge Cases
```bash
# Add questions that might trip up the system
# Ensure graceful handling
```

### 3. Track Results Over Time
```bash
# Keep eval-results.json files dated
# Monitor score trends

eval-results-2025-01-08.json
eval-results-2025-01-09.json
```

### 4. Use for Development
```bash
# Run evals after code changes
# Catch regressions early
```

## Success Criteria for Demo

**Required:**
- ✅ 90%+ intent accuracy
- ✅ 80%+ average score
- ✅ All categories have ≥1 passing question
- ✅ At least 8/10 questions passing

**Nice to Have:**
- ✅ 95%+ intent accuracy
- ✅ 85%+ average score
- ✅ All questions passing

## Next Steps

1. Run baseline evaluation
2. Review failed questions
3. Iterate on prompts/criteria
4. Select final demo questions
5. Practice with selected questions
6. Re-run evals before demo

---

**Remember:** The eval system helps ensure consistency, but human review of responses is still important for final demo preparation!
