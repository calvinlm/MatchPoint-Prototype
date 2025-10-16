export async function readErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const data = await res.clone().json();
      const envelopeMessage =
        typeof data?.error?.message === "string"
          ? data.error.message
          : typeof data?.message === "string"
            ? data.message
            : null;
      if (envelopeMessage) {
        return envelopeMessage;
      }
    } catch {
      // ignore JSON parse errors and fall back to text
    }
  }

  try {
    const text = await res.clone().text();
    if (text) return text;
  } catch {
    // ignore text read issues
  }

  return fallback;
}
