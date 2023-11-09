import type { SnapConfig } from '@chainsafe/metamask-polkadot-types';
import { getMetamaskState } from '../rpc/getMetamaskState';
import {
  availConfiguration,
  defaultConfiguration,

} from './predefined';

export function getDefaultConfiguration(networkName: string): SnapConfig {
  switch (networkName) {

    case 'avail':
      console.log('avail configuration selected');
      return availConfiguration;
    default:
      return defaultConfiguration;
  }
}

export async function getConfiguration(): Promise<SnapConfig> {
  const state = await getMetamaskState();

  if (!state || !state.config) {
    return defaultConfiguration;
  }
  return JSON.parse(<string>state.config) as SnapConfig;
}
