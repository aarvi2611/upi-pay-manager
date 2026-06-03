function normalizeBaseUrl(url: string) {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getPublicBaseUrl(headersList?: Headers) {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  }

  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl) {
    return normalizeBaseUrl(vercelUrl);
  }

  const host = headersList?.get("x-forwarded-host") || headersList?.get("host");
  if (host) {
    const proto =
      headersList?.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return normalizeBaseUrl(`${proto}://${host}`);
  }

  return "http://localhost:3000";
}
