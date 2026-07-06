import type {
  AgoraSessionConfig,
  RealtimeSessionConfig,
  RealtimeToolDefinition,
} from './types.js';

function audioFormat(
  format: RealtimeSessionConfig['inputAudioFormat'] | RealtimeSessionConfig['outputAudioFormat'],
): AgoraSessionConfig['input_audio_format'] {
  if (!format) return undefined;
  return { type: 'audio/pcm', rate: format.rate ?? 24000, channels: 1 };
}

function toolDefinition(
  tool: RealtimeToolDefinition,
): { name: string; description?: string; parameters: Record<string, unknown> } {
  const output: { name: string; description?: string; parameters: Record<string, unknown> } = {
    name: tool.name,
    parameters: tool.parameters as Record<string, unknown>,
  };
  if (tool.description !== undefined) output.description = tool.description;
  return output;
}

export function toAgoraSessionConfig(config: Partial<RealtimeSessionConfig>): AgoraSessionConfig {
  const output: AgoraSessionConfig = {};
  if (config.instructions !== undefined) output.instructions = config.instructions;
  if (config.voice !== undefined) output.voice = config.voice;
  if (config.outputModalities !== undefined) output.output_modalities = config.outputModalities;
  const inputFormat = audioFormat(config.inputAudioFormat);
  if (inputFormat !== undefined) output.input_audio_format = inputFormat;
  const outputFormat = audioFormat(config.outputAudioFormat);
  if (outputFormat !== undefined) output.output_audio_format = outputFormat;
  if (config.turnDetection !== undefined && config.turnDetection !== null) output.turn_detection = config.turnDetection;
  if (config.tools !== undefined) output.tools = config.tools.map(toolDefinition);
  if (config.providerOptions !== undefined) output.provider_options = config.providerOptions;
  return output;
}
