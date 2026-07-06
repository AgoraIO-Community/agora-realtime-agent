import type {
  ConnectionState,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ILocalAudioTrack,
  IRemoteAudioTrack,
  UID,
} from 'agora-rtc-sdk-ng/esm';

export type AgoraConnectionState = ConnectionState;
export type AgoraLocalAudioTrack = ILocalAudioTrack;
export type AgoraMediaType = 'audio' | 'video' | 'datachannel';
export type AgoraRemoteAudioTrack = IRemoteAudioTrack;
export type AgoraRemoteUser = IAgoraRTCRemoteUser;
export type AgoraRtcClient = IAgoraRTCClient;
export type AgoraVolumeIndicator = { level: number; uid: UID };
