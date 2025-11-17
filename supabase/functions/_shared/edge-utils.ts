/**
 * Utility functions for edge functions
 * Provides retry logic, timeout handling, and error management
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next attempt
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  throw lastError!;
}

/**
 * Add timeout to a promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError?: Error
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(timeoutError || new Error(`Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Structured logging helper
 */
export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
}

export function createLogger(functionName: string) {
  return {
    info: (message: string, context?: Record<string, any>) =>
      log({ level: 'info', message, context }, functionName),
    warn: (message: string, context?: Record<string, any>) =>
      log({ level: 'warn', message, context }, functionName),
    error: (message: string, context?: Record<string, any>) =>
      log({ level: 'error', message, context }, functionName),
  };
}

function log(entry: LogEntry, functionName: string) {
  const logData = {
    ...entry,
    function: functionName,
    timestamp: new Date().toISOString(),
  };

  console[entry.level](JSON.stringify(logData));
}

/**
 * Standardized error response
 */
export function createErrorResponse(
  error: Error,
  statusCode: number = 500
): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Logs webhook request to database
 */
export async function logWebhookRequest(params: {
  supabaseClient: any;
  webhookName: string;
  requestBody: any;
  responseStatus: number;
  responseBody?: string;
  errorMessage?: string;
  processingTimeMs: number;
  ipAddress?: string;
}): Promise<void> {
  try {
    await params.supabaseClient
      .from('webhook_logs')
      .insert({
        webhook_name: params.webhookName,
        request_body: params.requestBody,
        response_status: params.responseStatus,
        response_body: params.responseBody,
        error_message: params.errorMessage,
        processing_time_ms: params.processingTimeMs,
        ip_address: params.ipAddress,
      });
  } catch (error) {
    // Don't throw error if logging fails, just log to console
    console.error('Failed to log webhook request:', error);
  }
}

