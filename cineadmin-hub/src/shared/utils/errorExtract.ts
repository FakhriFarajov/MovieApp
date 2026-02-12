// Error extraction helper
export function extractApiErrors(error: any): string[] {
  const errors: string[] = [];
  if (!error) return errors;
  if (error.response && error.response.data) {
    const data = error.response.data;
    // RFC 9110 validation errors
    if (data.errors && typeof data.errors === 'object') {
      Object.values(data.errors).forEach((msgs: any) => {
        if (Array.isArray(msgs)) msgs.forEach((msg: string) => errors.push(msg));
      });
    }
    // Single message
    if (data.message || data.Message) {
      errors.push(data.message || data.Message);
    }
    // Fallback for string error
    if (typeof data === "string") {
      errors.push(data);
    }
  } else if (typeof error === "string") {
    errors.push(error);
  }
  return errors;
}