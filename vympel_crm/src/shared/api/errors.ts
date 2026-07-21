import { CrmApiError } from "@/shared/api/client";

const technicalMessagePattern = /(exception|stack|trace|org\.|java\.|jakarta\.|hibernate|sql|syntax|at\s+[\w.$]+\()/i;

export function getCrmErrorMessage(
  error: unknown,
  fallback: string,
  validationFallback = fallback,
  codeMessages?: Readonly<Record<string, string>>
) {
  if (error instanceof CrmApiError && error.code && codeMessages?.[error.code]) {
    return codeMessages[error.code];
  }

  if (error instanceof CrmApiError && error.code === "VALIDATION_ERROR") {
    return validationFallback;
  }

  if (error instanceof CrmApiError && error.message && !technicalMessagePattern.test(error.message)) {
    return error.message;
  }

  return fallback;
}
