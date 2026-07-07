import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BADGE_NAME = 'npm-homepage.svg';
const SURFACE = 'npm-readme-svg';

export async function GET(
  request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  if (name !== BADGE_NAME) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const url = new URL(request.url);
  const pkg = sanitizePackageName(url.searchParams.get('pkg'));
  logBadgeView(request, pkg, url.pathname);

  return new Response(renderBadgeSvg(pkg), {
    headers: {
      'cache-control': 'no-store, max-age=0, s-maxage=0',
      'content-type': 'image/svg+xml; charset=utf-8',
      'x-robots-tag': 'noindex',
    },
  });
}

function sanitizePackageName(value: string | null): string {
  const sanitized = (value || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, '-')
    .replace(/[-.]{2,}/gu, '-')
    .replace(/^[-.]+|[-.]+$/gu, '');

  return sanitized || 'unknown';
}

function logBadgeView(request: Request, pkg: string, path: string) {
  const event: Record<string, string> = {
    event: 'npm_readme_badge_view',
    pkg,
    surface: SURFACE,
    path,
    referer: request.headers.get('referer') || '',
    userAgent: request.headers.get('user-agent') || '',
    timestamp: new Date().toISOString(),
  };

  const ipHash = hashedClientIp(request);
  if (ipHash) {
    event.ipHash = ipHash;
  }

  console.log(JSON.stringify(event));
}

function hashedClientIp(request: Request): string | undefined {
  const salt = process.env.AGORA_BADGE_ANALYTICS_SALT;
  if (!salt) {
    return undefined;
  }

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwardedFor || request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip');
  if (!ip) {
    return undefined;
  }

  const day = new Date().toISOString().slice(0, 10);
  return createHash('sha256').update(`${salt}:${day}:${ip}`).digest('hex');
}

function renderBadgeSvg(pkg: string) {
  const label = 'homepage';
  const message = 'Agora Voice Agents';
  const pkgTitle = escapeXml(pkg);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="178" height="20" role="img" aria-label="${escapeXml(label)}: ${escapeXml(message)}" data-package="${pkgTitle}">
  <title>${escapeXml(label)}: ${escapeXml(message)} (${pkgTitle})</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#fff" stop-opacity=".7"/>
    <stop offset=".1" stop-color="#aaa" stop-opacity=".1"/>
    <stop offset=".9" stop-opacity=".3"/>
    <stop offset="1" stop-opacity=".5"/>
  </linearGradient>
  <clipPath id="r"><rect width="178" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="70" height="20" fill="#111827"/>
    <rect x="70" width="108" height="20" fill="#2563eb"/>
    <rect width="178" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="35" y="15" fill="#010101" fill-opacity=".3">${escapeXml(label)}</text>
    <text x="35" y="14">${escapeXml(label)}</text>
    <text x="124" y="15" fill="#010101" fill-opacity=".3">${escapeXml(message)}</text>
    <text x="124" y="14">${escapeXml(message)}</text>
  </g>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
