export type AppErrorCode = 'not-found' | 'validation' | 'conflict' | 'simulated' | 'unexpected';

/** Error type raised by repositories and services. Messages never contain patient data. */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly details: readonly string[] = [],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.details.length ? `${error.message} ${error.details.join(' ')}` : error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}
