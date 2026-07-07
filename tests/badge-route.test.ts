import assert from 'node:assert/strict';
import test from 'node:test';

import { GET } from '../apps/website/app/api/badges/[name]/route';

test('npm homepage badge route returns a non-cacheable svg badge and logs analytics metadata', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => {
    logs.push(String(message));
  };

  try {
    const request = new Request('https://agora-realtime-agent.vercel.app/api/badges/npm-homepage.svg?pkg=agora-realtime-react', {
      headers: {
        referer: 'https://www.npmjs.com/package/agora-realtime-react',
        'user-agent': 'Mozilla/5.0 npm-package-view',
        'x-forwarded-for': '203.0.113.42, 10.0.0.1',
      },
    });

    const response = await GET(request, { params: Promise.resolve({ name: 'npm-homepage.svg' }) });
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^image\/svg\+xml/);
    assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0, s-maxage=0');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.match(body, /^<svg/);
    assert.match(body, /Agora Voice Agents/);

    assert.equal(logs.length, 1);
    const event = JSON.parse(logs[0] ?? '{}');
    assert.equal(event.event, 'npm_readme_badge_view');
    assert.equal(event.pkg, 'agora-realtime-react');
    assert.equal(event.surface, 'npm-readme-svg');
    assert.equal(event.referer, 'https://www.npmjs.com/package/agora-realtime-react');
    assert.equal(event.userAgent, 'Mozilla/5.0 npm-package-view');
    assert.ok(!('ip' in event));
  } finally {
    console.log = originalLog;
  }
});

test('npm homepage badge route rejects non-svg badge names and sanitizes package values', async () => {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (message?: unknown) => {
    logs.push(String(message));
  };

  try {
    const badResponse = await GET(
      new Request('https://agora-realtime-agent.vercel.app/api/badges/other.svg?pkg=x'),
      { params: Promise.resolve({ name: 'other.svg' }) },
    );
    assert.equal(badResponse.status, 404);

    const response = await GET(
      new Request('https://agora-realtime-agent.vercel.app/api/badges/npm-homepage.svg?pkg=<script>alert(1)</script>'),
      { params: Promise.resolve({ name: 'npm-homepage.svg' }) },
    );
    assert.equal(response.status, 200);

    const event = JSON.parse(logs.at(-1) ?? '{}');
    assert.equal(event.pkg, 'script-alert-1-script');
  } finally {
    console.log = originalLog;
  }
});
