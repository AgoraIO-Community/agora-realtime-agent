import { AgoraClient, Area } from 'agora-agents';
import { NextResponse } from 'next/server';
import { configureNodeFetchProxy } from '../node-fetch-proxy';

export const runtime = 'nodejs';

type EndBody = {
  agent?: { id?: string; rtc_uid?: string | number };
  rtc?: { app_id?: string; channel?: string; agent_rtc_uid?: string | number };
  session_id?: string;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function clientFor(appId: string, appCertificate: string): AgoraClient {
  return new AgoraClient({ appId, appCertificate, area: Area.US });
}

export async function POST(request: Request) {
  configureNodeFetchProxy();
  const body = await request.json().catch(() => ({})) as EndBody;
  const appId = env('AGORA_APP_ID') ?? body.rtc?.app_id;
  const appCertificate = env('AGORA_APP_CERTIFICATE');
  const agentId = body.agent?.id;

  if (!appId || !appCertificate || !agentId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await clientFor(appId, appCertificate).stopAgent(agentId);
    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json(
      {
        error: {
          code: 'convoai_agent_leave_failed',
          message: caught instanceof Error ? caught.message : 'Failed to stop ConvoAI agent',
          retryable: true,
        },
      },
      { status: 502 },
    );
  }
}
