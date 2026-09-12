export class RequestError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function requestOriginAllowed(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const source = new URL(origin);
    const target = new URL(request.url);
    return source.origin === target.origin ||
      (source.origin === origin && source.host === request.headers.get("host") && source.protocol === target.protocol);
  } catch { return false; }
}

export async function readJson(request: Request, limit = 8192): Promise<Record<string, unknown>> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new RequestError("JSON is required.", 415);
  if (!requestOriginAllowed(request)) throw new RequestError("Request origin is not allowed.", 403);
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError("Request body is required.");
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > limit) { await reader.cancel(); throw new RequestError("Request is too large.", 413); }
    chunks.push(value);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new RequestError("Invalid JSON object."); }
}

const attempts = new Map<string, { count: number; until: number }>();
// Local backstop only. Production also needs a distributed edge rate limit.
export function rateLimited(request: Request, scope: string, max = 10) {
  const key = `${scope}:${request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}`;
  const now = Date.now();
  if (attempts.size > 5000) attempts.clear();
  const entry = attempts.get(key);
  if (!entry || entry.until < now) { attempts.set(key, { count: 1, until: now + 600000 }); return false; }
  return ++entry.count > max;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
