#!/bin/bash

# Test script to compare v0.2.0 vs v0.3.1 chat endpoints
# Usage: ./test-chat-versions.sh

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
SESSION_ID="test-session-$(date +%s)"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Chat API Versions${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Session ID: ${YELLOW}${SESSION_ID}${NC}"
echo ""

# Test questions
QUESTIONS=(
  "What is this codebase about?"
  "How does the GitHubAdapter work?"
  "How do I use the MemoryPalace API?"
)

# Function to test an endpoint
test_endpoint() {
  local endpoint=$1
  local version=$2
  local question=$3

  echo -e "${GREEN}[$version] Testing: ${question}${NC}"
  echo ""

  curl -s -X POST "${BASE_URL}${endpoint}" \
    -H "Content-Type: application/json" \
    -d "{
      \"message\": \"${question}\",
      \"conversationHistory\": [],
      \"sessionId\": \"${SESSION_ID}\"
    }" | while IFS= read -r line; do
      # Parse JSON and extract content or metadata
      if echo "$line" | grep -q '"metadata"'; then
        echo -e "${YELLOW}Metadata:${NC} $(echo "$line" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)"
      elif echo "$line" | grep -q '"content"'; then
        echo -n "$(echo "$line" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)"
      fi
    done

  echo ""
  echo ""
  echo "---"
  echo ""
}

# Test each question on both versions
for question in "${QUESTIONS[@]}"; do
  echo -e "${BLUE}Question: ${question}${NC}"
  echo ""

  # Test v0.2.0
  test_endpoint "/api/chat" "v0.2.0" "$question"

  # Test v0.3.1
  test_endpoint "/api/chat-v3" "v0.3.1" "$question"

  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo ""
done

echo -e "${GREEN}Testing complete!${NC}"
