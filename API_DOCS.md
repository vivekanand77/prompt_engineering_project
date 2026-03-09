# API Documentation

## Endpoints

### POST /api/generate

Generate AI responses for prompts.

**Request:**
```typescript
{
  prompt: string;        // Required: The prompt to generate a response for (max 10,000 chars)
  model?: string;        // Optional: Model to add ("NVIDIA Qwen" | "Gemini Pro" | "GPT-4")
  temperature?: number;  // Optional: Temperature 0-1 (default: 0.7)
  maxTokens?: number;    // Optional: Max output tokens 64-4096 (default: 512)
}
```

**Response:**
```typescript
{
  output: string;        // Generated response
  model: string;         // Model used
  live: boolean;         // Whether a real API was used (vs simulation)
  tokens: {
    input: number;       // Input token count
    output: number;      // Output token count
    total: number;       // Total token count
  };
  timestamp: string;     // ISO timestamp
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (validation error)
- `429` - Rate limit exceeded (20 requests/minute)
- `500` - Internal server error

**Rate Limit:** 20 requests per minute per IP address

---

### POST /api/score

Score prompt quality using AI or heuristics.

**Request:**
```typescript
{
  prompt: string;  // Required: The prompt to score
}
```

**Response:**
```typescript
{
  score: number;    // Score 0-100
  feedback: string; // Short feedback (3-5 words)
  live: boolean;    // Whether AI scoring was used
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `429` - Rate limit exceeded (30 requests/minute)
- `500` - Internal server error

**Rate Limit:** 30 requests per minute per IP address

---

### GET /api/status

Check which AI providers are configured and available.

**Response:**
```typescript
{
  providers: {
    openai: boolean;   // OpenAI API configured
    google: boolean;   // Google Gemini API configured
    nvidia: boolean;   // NVIDIA API configured
  }
}
```

**Status Codes:**
- `200` - Success

---

### GET /api/health

Health check endpoint for monitoring.

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";  // Service health status
  timestamp: string;              // ISO timestamp
  version: string;                // API version
  providers: {
    openai: boolean;
    google: boolean;
    nvidia: boolean;
  };
  uptime: number;                 // Uptime in milliseconds
}
```

**Status Codes:**
- `200` - Healthy (at least one provider configured)
- `503` - Degraded (no providers configured, running in simulation mode)

---

## Error Response Format

All error responses follow this format:

```typescript
{
  error: string;        // Human-readable error message
  code?: string;        // Machine-readable error code
  statusCode: number;   // HTTP status code
  details?: unknown;    // Additional error context (optional)
}
```

## Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_API_ERROR` - External API provider error
- `CONFIGURATION_ERROR` - Server configuration issue
- `NOT_FOUND` - Resource not found

## Rate Limiting

Rate limits are enforced per IP address:
- `/api/generate`: 20 requests per minute
- `/api/score`: 30 requests per minute

Rate limit information is tracked in-memory with automatic cleanup.

## Environment Variables

See `.env.example` for required and optional environment variables.

### AI Provider Keys (Optional)
- `OPENAI_API_KEY` - OpenAI/NVIDIA API key
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `NVIDIA_API_KEY` - NVIDIA API key

If no API keys are provided, the application runs in simulation mode.

### Firebase (Optional)
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Security

- All endpoints have rate limiting
- Request validation with TypeScript schemas
- Security headers (HSTS, CSP, XSS Protection, etc.)
- Automatic request timeouts (30s)
- Retry logic with exponential backoff
- Structured error logging

## Monitoring

- Health check endpoint: `/api/health`
- Structured logging for all requests
- External API call tracking
- Response time tracking
