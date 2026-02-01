function getCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf-token='));

  return match ? match.split('=')[1] : null;
}

async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfCookie();
  if (token) return token;

  try {
    const res = await fetch('/api/csrf');
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken;
    }
  } catch {
    // Fail silently - CSRF is defense-in-depth
  }

  return null;
}

export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutating) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      const headers = new Headers(options.headers);
      headers.set('x-csrf-token', csrfToken);
      options.headers = headers;
    }
  }

  return fetch(url, options);
}
