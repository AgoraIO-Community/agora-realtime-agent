import { randomUUID } from 'node:crypto';
import {
  Agent,
  AgoraClient,
  Area,
  ExpiresIn,
  generateConvoAIToken,
} from 'agora-agents';
import type { Experimental_RealtimeSessionConfig as RealtimeSessionConfig } from 'ai';
import { NextResponse } from 'next/server';
import type { AgoraRealtimeSetupResponse } from 'agora-realtime-react';
import { DEFAULT_AGENT_PIPELINE_ID, DEFAULT_AGENT_PIPELINE_ID_ENV } from '../../../../default-agent-config';
import { configureNodeFetchProxy } from '../node-fetch-proxy';

export const runtime = 'nodejs';

type SetupBody = {
  sessionConfig?: Partial<RealtimeSessionConfig>;
};

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function sessionId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '')}`;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberUid(seed: string, offset = 0): number {
  const numeric = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) + offset;
  return 10000 + (numeric % 80000);
}

function token(input: { appCertificate: string; appId: string; channel: string; uid: number }): string {
  return generateConvoAIToken({
    appId: input.appId,
    appCertificate: input.appCertificate,
    channelName: input.channel,
    uid: input.uid,
    tokenExpire: 3600,
    privilegeExpire: 3600,
  });
}

function convoAiConfig(sessionConfig: Partial<RealtimeSessionConfig> | undefined): Record<string, unknown> {
  const rawConfig = record(sessionConfig);
  const providerOptions = rawConfig.providerOptions ?? rawConfig.provider_options;
  return record(record(record(providerOptions).agora).convoai);
}

function clientFor(appId: string, appCertificate: string): AgoraClient {
  return new AgoraClient({ appId, appCertificate, area: Area.US });
}

export async function POST(request: Request) {
  configureNodeFetchProxy();
  const body = await request.json().catch(() => ({})) as SetupBody;
  const appId = env('AGORA_APP_ID');
  const appCertificate = env('AGORA_APP_CERTIFICATE');
  const session_id = sessionId('ars');
  const trace_id = sessionId('trc');

  if (!appId || !appCertificate) {
    return NextResponse.json(
      {
        error: {
          code: 'agora_credentials_missing',
          message: 'AGORA_APP_ID and AGORA_APP_CERTIFICATE are required.',
          retryable: false,
          trace_id,
        },
      },
      { status: 500 },
    );
  }

  const config = convoAiConfig(body.sessionConfig);
  const channel = `convo_${session_id}`;
  const browserUid = numberUid(session_id);
  const agentRtcUid = numberUid(session_id, 1);
  const browserToken = token({ appCertificate, appId, channel, uid: browserUid });

  const response: AgoraRealtimeSetupResponse = {
    session_id,
    trace_id,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    region: 'us-east-1',
    rtc: {
      app_id: appId,
      channel,
      uid: browserUid,
      token: browserToken,
      agent_rtc_uid: agentRtcUid,
    },
    agent: {
      rtc_uid: agentRtcUid,
    },
  };

  try {
    const client = clientFor(appId, appCertificate);
    const pipelineId = stringValue(config.pipeline_id)
      ?? stringValue(config.pipelineId)
      ?? env(DEFAULT_AGENT_PIPELINE_ID_ENV)
      ?? DEFAULT_AGENT_PIPELINE_ID;
    const agent = new Agent({ client, pipelineId });
    const session = agent.createSession({
      name: `${channel}-${trace_id}`,
      channel,
      agentUid: String(agentRtcUid),
      remoteUids: [String(browserUid)],
      expiresIn: ExpiresIn.seconds(3600),
      warn: () => undefined,
    });
    const agentId = await session.start();
    response.agent = {
      id: agentId,
      rtc_uid: agentRtcUid,
    };
  } catch (caught) {
    return NextResponse.json(
      {
        error: {
          code: 'convoai_agent_start_failed',
          message: caught instanceof Error ? caught.message : 'Failed to start ConvoAI agent',
          retryable: true,
          trace_id,
        },
      },
      { status: 502 },
    );
  }

  return NextResponse.json(response);
}
