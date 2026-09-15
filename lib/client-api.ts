export async function readResponse<T>(response: Response): Promise<T> {
  const result = await response.json();
  if (response.status === 401) {
    window.location.assign(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }
  if (!response.ok) throw new Error(result.error || 'Unable to save changes. Please try again.');
  return result as T;
}
