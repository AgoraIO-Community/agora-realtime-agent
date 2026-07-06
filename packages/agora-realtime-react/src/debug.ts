import type { AgoraRemoteUser } from './agora-types.js';
import type { AgoraRealtimeDebugState, AgoraRealtimeSetupResponse } from './types.js';

export const INITIAL_DEBUG_STATE: AgoraRealtimeDebugState = {
  isLocalAudioPublished: false,
  remoteAudioPlaying: false,
  remoteUsers: [],
  steps: [],
};

export function remoteUserSnapshots(users: AgoraRemoteUser[]): AgoraRealtimeDebugState['remoteUsers'] {
  return users.map((user) => ({
    hasAudio: Boolean(user.audioTrack),
    hasVideo: Boolean(user.videoTrack),
    uid: user.uid,
  }));
}

export function setupDebugSnapshot(setup: AgoraRealtimeSetupResponse): AgoraRealtimeDebugState['setup'] {
  return {
    ...(setup.agent?.id ? { agentId: setup.agent.id } : {}),
    ...(setup.agent?.status ? { agentStatus: setup.agent.status } : {}),
    ...(setup.agent?.trace_id ? { agentTraceId: setup.agent.trace_id } : {}),
    agentRtcUid: setup.rtc.agent_rtc_uid ?? setup.agent?.rtc_uid,
    channel: setup.rtc.channel,
    sessionId: setup.session_id,
    token: setup.rtc.token ? 'present' : 'missing',
    traceId: setup.trace_id,
    uid: setup.rtc.uid,
  };
}
