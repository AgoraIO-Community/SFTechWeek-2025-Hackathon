# Agora Conversational AI - 500 Internal Server Error

## Issue Report for Agora Support

**Date:** January 9, 2025  
**Project ID:** 24d99bd91f12409ea5a56f5eb5e0d930  
**API Key:** 255c6b6cca7f4d4f9d62e5ae07150559  

---

## Problem Description

Getting **500 Internal Server Error** when calling the Conversational AI v2 API endpoint with proper authentication and payload structure.

### Error Details

**Endpoint:**
```
POST https://api.agora.io/api/conversational-ai-agent/v2/projects/24d99bd91f12409ea5a56f5eb5e0d930/join
```

**Request Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Basic <base64(api_key:api_secret)>"
}
```

**Request Payload:**
```json
{
  "properties": {
    "channel_name": "test-basic-channel",
    "uid": "888888",
    "output_modalities": ["audio"]
  }
}
```

**Response:**
```
Status: 500 Internal Server Error

{
  "detail": "core: edge failed, reason: 'NoneType' object has no attribute 'output_modalities'",
  "reason": "InternalServerError"
}
```

---

## What I've Tried

### 1. Different Payload Structures
- ❌ Flat structure: `{channel_name, uid}` → 400 Bad Request
- ❌ Wrapped in "properties": `{properties: {...}}` → 500 Internal Server Error
- ❌ With nested config → 500 Internal Server Error

### 2. Different Configurations
- ❌ Audio only: `output_modalities: ["audio"]` → 500 error
- ❌ Audio + Video: `output_modalities: ["audio", "video"]` → 500 error
- ❌ With avatar config → 500 error
- ❌ Without avatar config → 500 error

### 3. Verified

Authentication
- ✅ API Key/Secret are valid
- ✅ Base64 encoding correct
- ✅ Authorization header properly formatted
- ✅ Rate limits not exceeded (99/100 remaining)

---

## Analysis

The error message `'NoneType' object has no attribute 'output_modalities'` suggests:

1. **Internal configuration missing** - The API expects a configuration object that doesn't exist
2. **Feature not fully enabled** - Conversational AI feature may need additional setup in console
3. **Required fields missing** - Payload may need additional required fields
4. **API version mismatch** - Using v2 endpoint but account might be on different version

---

## Questions for Agora Support

1. **Is Conversational AI fully enabled for my project?**
   - Project ID: 24d99bd91f12409ea5a56f5eb5e0d930
   - Do I need to enable anything in the console?

2. **What is the correct payload structure for the v2 join endpoint?**
   - Can you provide a complete example request?
   - Required vs optional fields?

3. **Does this feature require a specific plan/subscription?**
   - Am I on the right plan for Conversational AI?
   - Are there additional setup steps?

4. **Is there a setup/initialization step I'm missing?**
   - Do I need to create an agent configuration first?
   - Is there a project-level setting to enable?

5. **Can you check your logs for my requests?**
   - App ID: 24d99bd91f12409ea5a56f5eb5e0d930
   - Timestamp: January 9, 2025, ~18:09 UTC
   - Request ID from response: Various (see headers)

---

## Use Case

**Purpose:** Integrate HeyGen video avatars for AI todo assistant

**Architecture:**
```
Browser (user) → Agora RTC → Conversational AI Agent → HeyGen Avatar
```

**Required Integrations:**
- LLM: Groq (for intelligence)
- TTS: ElevenLabs (24kHz for HeyGen)
- Avatar: HeyGen (for video)

**Reference:** https://docs.agora.io/en/conversational-ai/models/avatar/heygen

---

## Technical Context

### Working Agora Features
✅ RTC Token generation  
✅ Channel management  
✅ WebRTC connections  
✅ Basic voice chat  

### Not Working
❌ Conversational AI agent creation (500 error)

### API Response Headers (from actual request)
```
x-capacity-ratelimit-limit-second: 100
x-capacity-ratelimit-remaining-second: 100
x-ratelimit-remaining-second: 99
x-ratelimit-limit-second: 100
server: common-gateway
x-request-id: b0486197bb2c40febca6a75a8c5364ad
x-agora-trace-id: e834592c-3db5-400a-9692-06e636be9153#1
```

---

## Request

Please provide:

1. **Correct API request format** for starting a Conversational AI agent
2. **Documentation** for the v2 API endpoints
3. **Setup instructions** if additional console configuration needed
4. **Error resolution** for the 'NoneType' output_modalities issue
5. **Example code** for HeyGen avatar integration (Python preferred)

---

## Urgency

This is for a **hackathon project** (SF Tech Week 2025). Working alternative features are ready, but video avatar integration is a key showcase feature.

**Timeline:** Demo in 24-48 hours

---

## Contact

**GitHub Repo:** SFTechWeek-2025-Hackathon  
**Project:** Luna AI Todo Assistant  
**Developer:** hjlees  

Thank you for your assistance!

---

**Generated:** January 9, 2025  
**Document:** AGORA_SUPPORT_REQUEST.md

