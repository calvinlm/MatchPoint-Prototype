export function sendError(res, status, code, message, details) {
  const payload = {
    error: {
      code: code || `HTTP_${status}`,
      message,
    },
  };

  if (details !== undefined && details !== null) {
    payload.error.details =
      details instanceof Error ? { message: details.message } : details;
  }

  return res.status(status).json(payload);
}

export function errorEnvelope(code, message, details) {
  const payload = {
    error: {
      code,
      message,
    },
  };

  if (details !== undefined && details !== null) {
    payload.error.details =
      details instanceof Error ? { message: details.message } : details;
  }

  return payload;
}
