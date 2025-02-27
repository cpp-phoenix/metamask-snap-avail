export function getPolkascanTxUrl(txHash: string, network: string): string {
  switch (network) {
    case 'kusama':
      return `https://polkascan.io/kusama/transaction/${txHash}`;
    case 'westend':
      return `https://westend.subscan.io/extrinsic/${txHash}`;
    case 'avail':
      return `https://goldberg.avail.tools/#/explorer/${txHash}`;
    default:
      return '';
  }
}
