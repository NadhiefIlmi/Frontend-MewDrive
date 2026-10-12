/**
 * error-reporting.ts
 * Centralized error reporting utility.
 * Logs errors to the console in development.
 * Replace the body of `reportError` with your preferred
 * error-tracking service (e.g. Sentry) when ready for production.
 */

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
): void {
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[MewDrive Error]", message, { error, ...context });
}
