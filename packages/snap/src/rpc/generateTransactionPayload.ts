// import type { ApiPromise } from '@polkadot/api/';
import type { SubmittableExtrinsic } from '@polkadot/api/types';
import type { TxPayload } from '@chainsafe/metamask-polkadot-types';
import { getAddress } from './getAddress';
import { ApiPromise, formatNumberToBalance, getDecimals } from 'avail-js-sdk';
import { getKeyPair } from '../polkadot/account';
import { showConfirmationDialog } from '../util/confirmation';
import { Hash } from '@polkadot/types/interfaces';
import { getApi } from '../../src/polkadot/api';

export async function generateTransactionPayload(
  api: ApiPromise,
  to: string,
  amount: string | number
): Promise<Hash | undefined> {
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
  const data: SubmittableExtrinsic<'promise'> = api.tx.balances.transfer(to, amount);
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
  const keyPair = await getKeyPair();

  const confirmation = await showConfirmationDialog({
    description: `It will be signed with address: ${keyPair.address}`,
    prompt: `Do you want to sign this message?`,
    textAreaContent: signerPayload.toPayload().method
  });
  if (confirmation) {
    let api = await getApi();
    const options = { app_id: 0, nonce: -1 }
    const decimals = getDecimals(api);
    const amount = formatNumberToBalance(1, decimals)
    const tx = api.tx.balances.transfer(to, amount).signAndSend(keyPair, options);
    console.log("TX", JSON.stringify(tx))
    return tx;
  }
  return undefined;

  // create SignerPayload


  // return {
  //   payload: signerPayload.toPayload(),
  //   tx: transaction.toHex()
  // };
}
