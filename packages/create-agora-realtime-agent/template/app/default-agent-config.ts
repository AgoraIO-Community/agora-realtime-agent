import type { Experimental_RealtimeSessionConfig as RealtimeSessionConfig } from 'ai';
import agentConfig from '../agent.config.json';

export const DEFAULT_AGENT_PIPELINE_ID_ENV = 'AGORA_CONVOAI_PIPELINE_ID';
export const DEFAULT_AGENT_PIPELINE_ID = agentConfig.convoai.pipelineId;

export function buildDefaultAgentSessionConfig(): Partial<RealtimeSessionConfig> {
  return {
    providerOptions: {
      agora: {
        convoai: {
          pipeline_id: DEFAULT_AGENT_PIPELINE_ID,
        },
      },
    },
  };
}
