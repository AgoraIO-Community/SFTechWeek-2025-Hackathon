# Quick Start: Demo Question Evaluation

## What Is This?

An automated system to test the voice avatar's responses for consistency and quality. It runs 10 demo questions and scores each response on a 100-point scale.

## Quick Run

```bash
# 1. Set environment
export GITHUB_TOKEN=your_token
export GROQ_API_KEY=your_key

# 2. Build
npm run build

# 3. Run evals
node dist/eval-demo.js
```

## What It Tests

**10 Questions Across 4 Categories:**

1. **Overview (2)** - "What is this codebase about?"
2. **Implementation (3)** - "How does the MemoryPalace class work?"
3. **Usage (3)** - "How do I use the API?"
4. **Comparison (2)** - "What's the difference between X and Y?"

**Each Question Scored On:**
- ✅ Intent classification (20 pts)
- ✅ Response length (15 pts)
- ✅ Required keywords (25 pts)
- ✅ No forbidden terms (10 pts)
- ✅ File references (15 pts)
- ✅ Voice-friendly (15 pts)

**Passing: ≥70 points**

## Reading Results

### Console Output

```
📊 EVALUATION SUMMARY
════════════════════════════════════════════════════════════════

Total Questions: 10
Passed (≥70): 9 ✅
Failed (<70): 1 ❌

Average Score: 87.5/100
Intent Accuracy: 90.0%
```

### What's Good?

- **90%+ Intent Accuracy** - System understands questions
- **80%+ Average Score** - Responses are high quality
- **8+ Passed** - Most questions work well

### What's Bad?

- **<80% Intent Accuracy** - Needs tuning
- **<70 Average Score** - Review prompts
- **<8 Passed** - Fix failing questions

## Using for Demo Prep

### 1. Pick Your Questions

```bash
# Run eval
node dist/eval-demo.js

# Look at eval-results.json
# Pick questions with score ≥90 for demo
```

### 2. Test Consistency

```bash
# Run 3 times
node dist/eval-demo.js > run1.txt
node dist/eval-demo.js > run2.txt
node dist/eval-demo.js > run3.txt

# Scores should be within ±5 points
```

### 3. Fix Issues

```bash
# Check failed questions in output
# Common fixes:
# - Adjust question wording
# - Update success criteria
# - Tune LLM prompts
```

## Score Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| 90-100 | Excellent | ✅ Safe for demo |
| 80-89 | Good | ✅ Usable, monitor |
| 70-79 | Passing | ⚠️ Review issues |
| <70 | Failing | ❌ Fix before demo |

## Metrics Breakdown

### Intent Classification (20 pts)
Does it understand the question type?
- Overview: High-level questions
- Implementation: Code details
- Usage: How-to questions
- Comparison: A vs B

### Response Length (15 pts)
Is it the right length for voice?
- Too short: Lacks substance
- Too long: Loses listener
- Just right: 100-300 words typically

### Required Keywords (25 pts)
Does it mention key terms?
- Example: "MemoryPalace" question must say "MemoryPalace"
- Ensures accuracy

### File References (15 pts)
Does it cite specific files (when appropriate)?
- Implementation questions should
- Overview questions don't need to

### Voice Friendly (15 pts)
Is it suitable for text-to-speech?
- Natural language ✅
- Clear structure ✅
- Too many code blocks ❌

## Output Files

### eval-results.json
Full detailed results in JSON format
- Use for analysis
- Track over time
- Compare runs

### Console Output
Human-readable summary
- Quick overview
- Failed question details
- Category breakdown

## Common Issues

### "Intent Accuracy Low"
**Fix:** Question wording might be ambiguous
- Make questions more specific
- Use clearer keywords

### "Response Too Long"
**Fix:** Adjust max length or LLM prompt
- Emphasize "concise" in system prompt
- Reduce temperature parameter

### "Missing File References"
**Fix:** Check view loading
- Verify .alexandria/ directory exists
- Check file paths in views

### "Not Voice Friendly"
**Fix:** Tune prompts for natural language
- Emphasize "explain in words"
- Limit code blocks in prompt

## For The Demo

### Recommended Flow

1. **Week Before:**
   - Run baseline evals
   - Fix any failing questions
   - Aim for 90%+ pass rate

2. **Day Before:**
   - Run fresh evals
   - Select 4-5 best questions
   - Practice with selected questions

3. **Demo Day:**
   - Quick eval run (optional)
   - Use pre-selected high-scoring questions
   - Have backup questions ready

### Safe Demo Strategy

Pick questions like:
1. One overview (safest, consistent)
2. One usage (practical, relatable)
3. One implementation (shows depth)
4. Optional: One comparison (impressive if it works)

**Avoid:**
- Questions that scored <85 in evals
- Questions with inconsistent scores across runs
- Edge cases or tricky questions

## More Info

- Full documentation: `EVAL_SYSTEM.md`
- Implementation: `src/eval-demo.ts`
- Two-stage system: `TWO_STAGE_IMPLEMENTATION.md`

---

**Bottom Line:** Run evals, pick high-scoring questions (≥90), verify consistency, demo with confidence! 🎯
