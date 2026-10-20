# Ekalvya Newron ANI — Admin & Models Module

## Modules Overview
- **admin/**: Secure cookie session-based admin portal with dashboard metrics, provider health checks, model dropdown selection, live testing probes, and error logs.
- **models/**: Modular orchestration layer with automated fallback:
  1. OpenRouter (Supports 6 configurable models)
  2. Google Gemini Flash-Lite (@google/genai)
  3. Local Ollama (qwen3)
  - Unified DuckDuckGo real-time search context injection.
  - Keeps provider names hidden from the user-facing chat client.

## Wire into server.js
1. Import the modules:
   ```javascript
   import { generateChatResponse } from "./models/index.js";
   import adminRoutes from "./admin/adminRoutes.js";
   ```
2. Mount the admin router before static routes:
   ```javascript
   app.use("/admin", adminRoutes);
   ```
3. Point your chat handler to `generateChatResponse`:
   ```javascript
   const result = await generateChatResponse({
     message: message.trim(),
     history,
     image,
     useGoogleSearch,
     systemInstruction: SYSTEM_PROMPT,
   });
   ```