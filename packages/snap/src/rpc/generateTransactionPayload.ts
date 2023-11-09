// import type { ApiPromise } from '@polkadot/api/';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { TxPayload } from '@chainsafe/metamask-polkadot-types';
import { getAddress } from './getAddress';
import { ApiPromise, formatNumberToBalance } from 'avail-js-sdk';

export async function generateTransactionPayload(
  api: ApiPromise,
  to: string,
  amount: string | number
): Promise<TxPayload> {
  // fetch last signed block and account address
  const [signedBlock, address] = await Promise.all([api.rpc.chain.getBlock(), getAddress()]);
  // create signer options
  const nonce = (await api.derive.balances.account(address)).accountNonce;
  const signerOptions = {
    blockHash: signedBlock.block.header.hash,
    era: api.createType('ExtrinsicEra', {
      current: signedBlock.block.header.number,
      period: 50
    }),
    nonce
  };
  // define transaction method
  let _amount = formatNumberToBalance(1);
  const data: SubmittableExtrinsic<'promise'> = api.tx.balances.transfer(to, _amount);
  const signerPayload = api.createType('SignerPayload', {
    genesisHash: api.genesisHash,
    runtimeVersion: api.runtimeVersion,
    version: api.extrinsicVersion,
    ...signerOptions,
    address: to,
    blockNumber: signedBlock.block.header.number,
    method: data.method,
    signedExtensions: [],
    transactionVersion: data.version
  });

  return {
    payload: signerPayload.toPayload(),
    tx: data.toHex()
  };
}
