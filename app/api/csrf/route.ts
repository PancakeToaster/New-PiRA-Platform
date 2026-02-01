import { getCsrfToken, generateCsrfToken, csrfResponse } from '@/lib/csrf';

export async function GET() {
  const token = generateCsrfToken();
  return csrfResponse(token);
}
