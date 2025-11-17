/**
 * Validation utilities for edge functions
 * Provides secure input validation for webhooks and APIs
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates payment amount
 * - Must be positive
 * - Between 0.01 and 1,000,000
 * - Max 2 decimal places
 */
export function validateAmount(rawAmount: any): number {
  // Convert to number if string
  const amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;

  // Check if valid number
  if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
    throw new ValidationError('Amount must be a valid number');
  }

  // Check if positive
  if (amount <= 0) {
    throw new ValidationError('Amount must be positive');
  }

  // Check minimum
  if (amount < 0.01) {
    throw new ValidationError('Minimum amount is 0.01');
  }

  // Check maximum
  if (amount > 1000000) {
    throw new ValidationError('Maximum amount is 1,000,000');
  }

  // Check decimal places (max 2)
  const rounded = Math.round(amount * 100) / 100;
  if (Math.abs(rounded - amount) >= 0.001) {
    throw new ValidationError('Amount must have maximum 2 decimal places');
  }

  return rounded;
}

/**
 * Validates UUID format
 */
export function validateUUID(value: any): string {
  if (typeof value !== 'string') {
    throw new ValidationError('User ID must be a string');
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(value)) {
    throw new ValidationError('Invalid user ID format');
  }

  return value;
}

/**
 * Validates that user exists in database
 */
export async function validateUserExists(userId: string, supabaseClient: any): Promise<void> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new ValidationError(`User ${userId} not found`);
  }
}

/**
 * Validates URL format and protocol
 */
export function validateUrl(url: string, maxLength: number = 2048): string {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('URL must be a non-empty string');
  }

  if (url.length > maxLength) {
    throw new ValidationError(`URL too long (max ${maxLength} characters)`);
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new ValidationError('Only HTTP/HTTPS URLs allowed');
    }
    return url;
  } catch {
    throw new ValidationError('Invalid URL format');
  }
}

/**
 * Validates text content
 */
export function validateText(text: string, minLength: number, maxLength: number, fieldName: string = 'Text'): string {
  if (typeof text !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }

  const trimmed = text.trim();

  if (trimmed.length < minLength) {
    throw new ValidationError(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be at most ${maxLength} characters`);
  }

  return trimmed;
}
