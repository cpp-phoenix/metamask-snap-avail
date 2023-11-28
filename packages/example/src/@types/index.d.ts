import type { SnapConfig } from '@avail/metamask-polkadot-types';

declare module '@avail/metamask-polkadot-adapter' {
  export function injectMetamaskPolkadotSnapProvider(
    network: 'westend' | 'kusama',
    config?: SnapConfig,
    pluginOrigin?: string
  ): void;
}
