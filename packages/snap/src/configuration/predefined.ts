import type { SnapConfig } from '@chainsafe/metamask-polkadot-types';


export const availConfiguration: SnapConfig = {
  addressPrefix: 42,
  networkName: 'avail',
  unit: {
    decimals: 12,
    image: 'https://svgshare.com/i/L2d.svg',
    symbol: 'avl'
  },
  wsRpcUrl: 'wss://couscous-devnet.avail.tools/ws',
};



export const defaultConfiguration: SnapConfig = availConfiguration;
