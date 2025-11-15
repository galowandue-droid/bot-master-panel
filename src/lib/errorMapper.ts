/**
 * Maps internal database errors to user-friendly messages
 * Prevents information leakage about database structure, RLS policies, and internal logic
 */
export function getUserFriendlyError(error: any): string {
  const msg = error.message?.toLowerCase() || '';
  
  // Duplicate key violations
  if (msg.includes('duplicate') || msg.includes('unique constraint')) {
    return 'Это значение уже используется';
  }
  
  // RLS policy violations
  if (msg.includes('row-level security') || msg.includes('rls')) {
    return 'Недостаточно прав доступа';
  }
  
  // Not found errors
  if (msg.includes('not found') || msg.includes('does not exist')) {
    return 'Запись не найдена';
  }
  
  // Foreign key violations
  if (msg.includes('foreign key') || msg.includes('violates')) {
    return 'Невозможно удалить: есть связанные данные';
  }
  
  // Network/connection errors
  if (msg.includes('network') || msg.includes('timeout') || msg.includes('fetch')) {
    return 'Ошибка соединения. Проверьте интернет-соединение';
  }
  
  // Generic fallback - no internal details leaked
  return 'Произошла ошибка. Пожалуйста, попробуйте позже';
}
