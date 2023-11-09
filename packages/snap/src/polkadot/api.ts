import { ApiPromise, HttpProvider, WsProvider, initialize, signedExtensions, types } from 'avail-js-sdk';
import { getConfiguration } from '../configuration';
import { cryptoWaitReady } from '@polkadot/util-crypto';

let api: ApiPromise;
let provider: WsProvider;
let isConnecting: boolean;

/**
 * Initialize substrate api and awaits for it to be ready
 */
async function initApi(rpcUrl: string): Promise<ApiPromise> {
  try {
    provider = new WsProvider(rpcUrl);
  } catch (error) {
    console.error('Error on provider creation', error);
    throw error;
  }
  console.info('Provider created', provider);
  await cryptoWaitReady()
  api = await initialize(rpcUrl);

  console.info('Api is ready', api);
  return api;
}

export const resetApi = async (): Promise<void> => {
  if (api && provider) {
    try {
      await api.disconnect();
    } catch (e) {
      console.error('Error on api disconnect.');
    }
    api = null;
    provider = null;
  }
};

export const getApi = async (): Promise<ApiPromise> => {
  console.info('Getting api');
  if (!api) {
    // api not initialized or configuration changed
    const config = await getConfiguration();
    console.info('Config API', config);
    console.info('Connecting to', config.wsRpcUrl);
    api = await initApi(config.wsRpcUrl);
    console.info('API', api);
    isConnecting = false;
  } else {
    while (isConnecting) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!provider.isConnected) {
      isConnecting = true;
      await provider.connect();
      isConnecting = false;
    }
  }
  return api;
};
