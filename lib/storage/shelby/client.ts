import { appConfig } from "@/lib/config";

export type ShelbyClientConfig = {
  apiKey: string;
  rpcUrl: string;
  namespace: string;
  network: string;
  account: string;
  signerPrivateKey: string;
};

export type ShelbyClientHandle = {
  config: ShelbyClientConfig;
};

export function getShelbyClientConfig(): ShelbyClientConfig {
  return {
    apiKey: appConfig.shelby.apiKey,
    rpcUrl: appConfig.shelby.rpcUrl,
    namespace: appConfig.shelby.namespace,
    network: appConfig.shelby.network,
    account: appConfig.shelby.account,
    signerPrivateKey: appConfig.shelby.signerPrivateKey,
  };
}

export function isShelbyConfigured(config = getShelbyClientConfig()) {
  return Boolean(config.apiKey && config.rpcUrl && config.namespace);
}

export function createShelbyClient(): ShelbyClientHandle {
  const config = getShelbyClientConfig();

  return {
    config,
  };
}
