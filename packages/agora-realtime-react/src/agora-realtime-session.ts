import type {
  AgoraConnectionState,
  AgoraLocalAudioTrack,
  AgoraMediaType,
  AgoraRemoteAudioTrack,
  AgoraRemoteUser,
  AgoraRtcClient,
  AgoraVolumeIndicator,
} from './agora-types.js';
import { remoteUserSnapshots, setupDebugSnapshot } from './debug.js';
import { agoraAudioLevelEvent, agoraVolumeIndicatorEvent, sessionCreatedEvent } from './events.js';
import { errorFrom, errorFromResponse, textMessage } from './utils.js';
import type {
  AgoraRealtimeDebugState,
  AgoraRealtimeSetupResponse,
  RealtimeClientEvent,
  RealtimeServerEvent,
  RealtimeSessionConfig,
  RealtimeStatus,
  UIMessage,
  UseAgoraRealtimeOptions,
} from './types.js';

export type AgoraRealtimeSessionCallbacks = {
  appendMessage: (message: UIMessage) => void;
  onError: (error: Error) => void;
  onRemoteAudioTrack: (args: { mediaStreamTrack: MediaStreamTrack; uid: string | number }) => void;
  onRemoteAudioTrackEnded: (args: { uid: string | number }) => void;
  patchDebug: (patch: Partial<AgoraRealtimeDebugState>) => void;
  pushDebug: (label: string, details?: Record<string, unknown>) => void;
  pushEvent: (event: RealtimeServerEvent) => void;
  setCapturing: (isCapturing: boolean) => void;
  setPlaying: (isPlaying: boolean) => void;
  setStatus: (status: RealtimeStatus) => void;
};

export type AgoraRealtimeConnectOptions = {
  api: Pick<UseAgoraRealtimeOptions['api'], 'setup'>;
  sessionConfig?: Partial<RealtimeSessionConfig> | undefined;
};

export class AgoraRealtimeSession {
  private client: AgoraRtcClient | null = null;
  private localAudioTrack: AgoraLocalAudioTrack | null = null;
  private remoteAudioMeterTimer: ReturnType<typeof setInterval> | null = null;
  private remoteAudioTrack: AgoraRemoteAudioTrack | null = null;
  private setup: AgoraRealtimeSetupResponse | null = null;

  constructor(private readonly callbacks: AgoraRealtimeSessionCallbacks) {}

  async connect(options: AgoraRealtimeConnectOptions): Promise<void> {
    this.callbacks.setStatus('connecting');
    this.callbacks.patchDebug({
      connectionState: 'SETUP_REQUESTED',
      isLocalAudioPublished: false,
      lastError: undefined,
      lastRemoteAudioLevel: undefined,
      remoteAudioPlaying: false,
      remoteUsers: [],
      setup: undefined,
      steps: [],
    });
    this.callbacks.pushDebug('setup:request', { url: options.api.setup });
    try {
      const response = await fetch(options.api.setup, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionConfig: options.sessionConfig }),
      });
      if (!response.ok) {
        throw await errorFromResponse(response, `Agora realtime setup failed: ${response.status}`);
      }
      const setup = await response.json() as AgoraRealtimeSetupResponse;
      this.setup = setup;
      const setupDebug = setupDebugSnapshot(setup);
      this.callbacks.patchDebug({ connectionState: 'SETUP_READY', setup: setupDebug });
      this.callbacks.pushDebug('setup:response', setupDebug);

      const { createClient } = await import('agora-rtc-sdk-ng/esm');
      const client = createClient({ codec: 'vp8', mode: 'rtc' });
      this.client = client;
      this.registerClientEvents(client, setup);
      this.callbacks.pushDebug('rtc:join-start', {
        channel: setup.rtc.channel,
        token: setup.rtc.token ? 'present' : 'missing',
        uid: String(setup.rtc.uid),
      });
      await client.join(setup.rtc.app_id, setup.rtc.channel, setup.rtc.token, setup.rtc.uid);
      this.callbacks.patchDebug({ connectionState: 'CONNECTED', remoteUsers: remoteUserSnapshots(client.remoteUsers) });
      this.callbacks.pushDebug('rtc:join-success', {
        connectionState: 'CONNECTED',
        remoteUsers: remoteUserSnapshots(client.remoteUsers).length,
      });
      client.enableAudioVolumeIndicator();
      this.callbacks.pushDebug('rtc:volume-indicator-enabled');

      this.callbacks.setStatus('connected');
      this.callbacks.pushEvent(sessionCreatedEvent(setup));
    } catch (caught) {
      const error = errorFrom(caught, 'Failed to connect Agora realtime session');
      this.callbacks.setStatus('error');
      this.callbacks.patchDebug({ connectionState: 'ERROR', lastError: error.message });
      this.callbacks.pushDebug('rtc:error', { message: error.message });
      this.callbacks.onError(error);
      throw error;
    }
  }

  disconnect(endUrl: string | undefined): void {
    const setup = this.setup;
    void this.cleanupRtc();
    if (setup) {
      void this.postSessionAction(endUrl, { session_id: setup.session_id, agent: setup.agent, rtc: setup.rtc });
    }
    this.setup = null;
    this.callbacks.setStatus('disconnected');
  }

  startAudioCapture(stream: MediaStream): void {
    void (async () => {
      const setup = this.setup;
      if (!setup) {
        throw new Error('Agora realtime session is not connected');
      }
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('MediaStream does not include an audio track');
      }
      this.callbacks.pushDebug('capture:start', {
        enabled: audioTrack.enabled,
        muted: audioTrack.muted,
        readyState: audioTrack.readyState,
      });
      const client = this.client;
      if (!client) {
        throw new Error('Agora RTC client is not connected');
      }
      const { createCustomAudioTrack } = await import('agora-rtc-sdk-ng/esm');
      const localAudioTrack = createCustomAudioTrack({ mediaStreamTrack: audioTrack });
      this.localAudioTrack = localAudioTrack;
      await client.publish([localAudioTrack]);
      this.callbacks.setCapturing(true);
      this.callbacks.patchDebug({ isLocalAudioPublished: true });
      this.callbacks.pushDebug('capture:publish-success', { uid: String(setup.rtc.uid) });
    })().catch((caught) => {
      const error = errorFrom(caught, 'Failed to start Agora audio capture');
      this.callbacks.setStatus('error');
      this.callbacks.patchDebug({ isLocalAudioPublished: false, lastError: error.message });
      this.callbacks.pushDebug('capture:error', { message: error.message });
      this.callbacks.onError(error);
    });
  }

  stopAudioCapture(): void {
    const track = this.localAudioTrack;
    this.localAudioTrack = null;
    if (track) {
      void this.client?.unpublish([track]).catch(() => undefined);
      track.stop();
      track.close();
    }
    this.callbacks.setCapturing(false);
    this.callbacks.patchDebug({ isLocalAudioPublished: false });
    this.callbacks.pushDebug('capture:stop');
    this.callbacks.pushEvent({ type: 'speech-stopped', raw: { transport: 'agora-rtc' } });
  }

  sendTextMessage(text: string, textUrl: string | undefined): void {
    const trimmed = text.trim();
    const setup = this.setup;
    if (!trimmed || !setup) return;
    this.callbacks.appendMessage(textMessage('user', trimmed));
    void this.postSessionAction(textUrl, { session_id: setup.session_id, text: trimmed }).catch((caught) => {
      this.callbacks.onError(errorFrom(caught, 'Failed to send Agora text input'));
    });
  }

  sendEvent(event: RealtimeClientEvent, controlUrl: string | undefined): void {
    const setup = this.setup;
    if (!setup) return;
    void this.postSessionAction(controlUrl, { session_id: setup.session_id, event }).catch((caught) => {
      this.callbacks.onError(errorFrom(caught, 'Failed to send Agora control event'));
    });
  }

  stopPlayback(): void {
    this.stopRemoteAudioMeter();
    this.client?.remoteUsers.forEach((user) => user.audioTrack?.stop());
    this.callbacks.setPlaying(false);
  }

  async cleanupRtc(): Promise<void> {
    this.callbacks.pushDebug('rtc:cleanup-start');
    this.stopRemoteAudioMeter();
    const track = this.localAudioTrack;
    this.localAudioTrack = null;
    if (track) {
      try {
        const client = this.client;
        if (client) await client.unpublish([track]);
      } catch {
        // Ignore cleanup races from already-left RTC clients.
      }
      track.stop();
      track.close();
    }

    const client = this.client;
    this.client = null;
    if (client) {
      try {
        await client.leave();
      } catch {
        // Ignore cleanup races from already-left RTC clients.
      }
    }
    this.callbacks.setCapturing(false);
    this.callbacks.setPlaying(false);
    this.callbacks.patchDebug({
      connectionState: 'DISCONNECTED',
      isLocalAudioPublished: false,
      remoteAudioPlaying: false,
      remoteUsers: [],
    });
    this.callbacks.pushDebug('rtc:cleanup-complete');
  }

  private registerClientEvents(client: AgoraRtcClient, setup: AgoraRealtimeSetupResponse): void {
    client.on('user-published', async (user: AgoraRemoteUser, mediaType: AgoraMediaType) => {
      this.callbacks.pushDebug('remote:user-published', { mediaType, uid: String(user.uid) });
      this.callbacks.patchDebug({ remoteUsers: remoteUserSnapshots(client.remoteUsers) });
      try {
        await client.subscribe(user, mediaType);
        this.callbacks.patchDebug({ remoteUsers: remoteUserSnapshots(client.remoteUsers) });
        this.callbacks.pushDebug('remote:subscribe-success', {
          hasAudio: Boolean(user.audioTrack),
          mediaType,
          uid: String(user.uid),
        });
        if (mediaType === 'audio') {
          this.handleRemoteAudioPublished(setup, user);
        }
      } catch (caught) {
        const error = errorFrom(caught, 'Failed to subscribe Agora remote user');
        this.callbacks.patchDebug({ lastError: error.message, remoteUsers: remoteUserSnapshots(client.remoteUsers) });
        this.callbacks.pushDebug('remote:subscribe-error', { mediaType, message: error.message, uid: String(user.uid) });
        this.callbacks.onError(error);
      }
    });
    client.on('user-unpublished', (_user: AgoraRemoteUser, mediaType: AgoraMediaType) => {
      this.callbacks.pushDebug('remote:user-unpublished', { mediaType, uid: String(_user.uid) });
      this.callbacks.patchDebug({ remoteUsers: remoteUserSnapshots(client.remoteUsers) });
      if (mediaType === 'audio') {
        this.stopRemoteAudioMeter();
        this.callbacks.onRemoteAudioTrackEnded({ uid: _user.uid });
        this.callbacks.setPlaying(false);
        this.callbacks.patchDebug({ remoteAudioPlaying: false });
      }
    });
    client.on('user-joined', (user: AgoraRemoteUser) => {
      this.callbacks.pushDebug('remote:user-joined', { uid: String(user.uid) });
      this.callbacks.patchDebug({ remoteUsers: remoteUserSnapshots(client.remoteUsers) });
    });
    client.on('user-left', (user: AgoraRemoteUser) => {
      this.callbacks.pushDebug('remote:user-left', { uid: String(user.uid) });
      this.callbacks.onRemoteAudioTrackEnded({ uid: user.uid });
      this.callbacks.patchDebug({ remoteAudioPlaying: false, remoteUsers: remoteUserSnapshots(client.remoteUsers) });
    });
    client.on('volume-indicator', (volumes: AgoraVolumeIndicator[]) => {
      this.callbacks.pushEvent(agoraVolumeIndicatorEvent(
        setup,
        volumes.map((volume: AgoraVolumeIndicator) => ({ level: volume.level, uid: volume.uid })),
      ));
    });
    client.on('connection-state-change', (curState: AgoraConnectionState) => {
      this.callbacks.patchDebug({ connectionState: curState, remoteUsers: remoteUserSnapshots(client.remoteUsers) });
      this.callbacks.pushDebug('rtc:connection-state-change', { state: curState });
      if (curState === 'DISCONNECTED' || curState === 'DISCONNECTING') {
        this.callbacks.setStatus('disconnected');
      }
    });
  }

  private handleRemoteAudioPublished(setup: AgoraRealtimeSetupResponse, user: AgoraRemoteUser): void {
    const audioTrack = user.audioTrack;
    if (!audioTrack) {
      this.callbacks.pushDebug('remote:audio-track-missing', { uid: String(user.uid) });
      return;
    }
    try {
      audioTrack.play();
      this.callbacks.pushDebug('remote:audio-play-called', { uid: String(user.uid) });
    } catch (caught) {
      const error = errorFrom(caught, 'Failed to play Agora remote audio');
      this.callbacks.patchDebug({ lastError: error.message });
      this.callbacks.pushDebug('remote:audio-play-error', { message: error.message, uid: String(user.uid) });
      this.callbacks.onError(error);
    }
    this.callbacks.onRemoteAudioTrack({
      mediaStreamTrack: audioTrack.getMediaStreamTrack(),
      uid: user.uid,
    });
    this.startRemoteAudioMeter(setup, user.uid, audioTrack);
    this.callbacks.setPlaying(true);
    this.callbacks.patchDebug({ remoteAudioPlaying: true });
  }

  private stopRemoteAudioMeter(): void {
    if (this.remoteAudioMeterTimer !== null) {
      clearInterval(this.remoteAudioMeterTimer);
      this.remoteAudioMeterTimer = null;
    }
    this.remoteAudioTrack = null;
  }

  private startRemoteAudioMeter(
    setup: AgoraRealtimeSetupResponse,
    uid: string | number,
    track: AgoraRemoteAudioTrack,
  ): void {
    this.stopRemoteAudioMeter();
    this.remoteAudioTrack = track;
    this.remoteAudioMeterTimer = setInterval(() => {
      const level = this.remoteAudioTrack?.getVolumeLevel();
      if (typeof level !== 'number' || Number.isNaN(level)) return;
      this.callbacks.patchDebug({ lastRemoteAudioLevel: Math.min(1, Math.max(0, level)), remoteAudioPlaying: true });
      this.callbacks.pushEvent(agoraAudioLevelEvent(setup, { level, uid }));
    }, 80);
  }

  private async postSessionAction(url: string | undefined, body: Record<string, unknown>): Promise<void> {
    if (!url) return;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Agora realtime action failed: ${response.status}`);
    }
  }
}
