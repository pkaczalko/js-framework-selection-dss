export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, errors?: Record<string, string[]>) {
    super('API Error');
    this.status = status;
    this.errors = errors;
  }
}

export function parseErrors(errors: Record<string, string[]>): string[] {
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map((msg) => `${field} ${msg}`),
  );
}
