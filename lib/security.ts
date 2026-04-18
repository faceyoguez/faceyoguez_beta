/**
 * Centralized security utilities for input sanitization, validation, and audit logging.
 */

// ── Input Sanitization ──

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

/**
 * Strips dangerous HTML/script patterns from user input.
 * React already escapes JSX, but this protects server-side processing
 * and database storage from stored XSS payloads.
 */
export function sanitizeInput(input: string): string {
  let sanitized = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  // Strip null bytes (used in path traversal attacks)
  sanitized = sanitized.replace(/\0/g, '');
  return sanitized.trim();
}

/**
 * Validates that content doesn't exceed a maximum length.
 * Prevents payload bombs that could crash the server or fill the database.
 */
export function validateContentLength(
  content: string,
  maxLength: number
): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content must be a non-empty string' };
  }
  if (content.length > maxLength) {
    return { valid: false, error: `Content exceeds maximum length of ${maxLength} characters` };
  }
  return { valid: true };
}

// ── UUID Validation ──

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates that a string is a valid UUID v4.
 * Prevents injection of malicious values into database queries via ID parameters.
 */
export function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

// ── Security Event Logging ──

type SecurityEventType =
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'suspicious_input'
  | 'auth_failure'
  | 'bot_detected'
  | 'connection_limit';

interface SecurityEvent {
  type: SecurityEventType;
  ip?: string;
  userId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Structured security event logger.
 * In production, this could be piped to a SIEM or log aggregation service.
 * For now, it uses structured JSON to console for Vercel log drain compatibility.
 */
export function logSecurityEvent(
  type: SecurityEventType,
  metadata?: Partial<Omit<SecurityEvent, 'type' | 'timestamp'>>
): void {
  const event: SecurityEvent = {
    type,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  // Use console.warn for security events — they show up in Vercel logs
  // with a different severity level than regular console.log
  console.warn(`[SECURITY] ${JSON.stringify(event)}`);
}

// ── Suspicious Path Detection ──

const SUSPICIOUS_PATTERNS = [
  /\.\.\//,           // Path traversal
  /%00/,             // Null byte injection
  /%2e%2e/i,         // Encoded path traversal
  /\bUNION\b.*\bSELECT\b/i,  // SQL injection
  /\bDROP\b.*\bTABLE\b/i,     // SQL injection
  /<script/i,        // XSS in URL
  /\bexec\s*\(/i,    // Command injection
];

/**
 * Checks if a URL path contains suspicious patterns commonly used in attacks.
 */
export function isSuspiciousPath(path: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(path));
}
