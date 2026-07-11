import { toast } from "sonner";

// Thrown (and already surfaced to the user) when a fetch hits an expired session.
// Callers can ignore it — the page is about to navigate to /login.
export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired");
    this.name = "SessionExpiredError";
  }
}

let redirectingToLogin = false;

/**
 * fetch() wrapper for calling our API routes from client components.
 * On a 401 (expired/invalid session) it shows a toast, redirects to /login,
 * and throws SessionExpiredError so callers don't treat it as a normal failure.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401) {
    if (!redirectingToLogin) {
      redirectingToLogin = true;
      toast.error("Your session has expired. Redirecting to login…");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1200);
    }
    throw new SessionExpiredError();
  }

  return res;
}
