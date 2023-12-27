import { web3EnablePromise } from '@polkadot/extension-dapp';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { Network, VoyagerTransactionType, Erc20TokenBalance, Erc20Token, Account } from '@types';
import type { InjectedMetamaskExtension } from '@avail/metamask-polkadot-adapter/src/types';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { enablePolkadotSnap } from '@avail/metamask-polkadot-adapter';
import type { MetamaskPolkadotSnap } from '@avail/metamask-polkadot-adapter/build/snap';
import Toastr from 'toastr2';
import { setInfoModalVisible, setMinVersionModalVisible } from 'slices/modalSlice';
import {
  setForceReconnect,
  setWalletConnection,
  setErc20TokenBalances,
  setAccounts,
  setErc20TokenBalanceSelected
} from 'slices/walletSlice';
import { disableLoading, enableLoadingWithMessage } from 'slices/UISlice';
import { setNetworks, setActiveNetwork } from 'slices/networkSlice';

export function hasMetaMask(): boolean {
  if (!window.ethereum) {
    return false;
  }
  return window.ethereum.isMetaMask;
}

export const defaultSnapId = 'local:http://localhost:8081';

export async function installPolkadotSnap(): Promise<boolean> {
  const snapId = process.env.REACT_APP_SNAP_ID ? process.env.REACT_APP_SNAP_ID : defaultSnapId;
  try {
    await enablePolkadotSnap({ networkName: 'westend' }, snapId);
    console.info('Snap installed!!');
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function isPolkadotSnapInstalled(): Promise<boolean> {
  return !!(await getInjectedMetamaskExtension());
}

export async function getInjectedMetamaskExtension(): Promise<InjectedMetamaskExtension | null> {
  const extensions = await web3EnablePromise;
  return getMetamaskExtension(extensions || []) || null;
}

function getMetamaskExtension(
  extensions: InjectedExtension[]
): InjectedMetamaskExtension | undefined {
  return extensions.find((item) => item.name === 'metamask-polkadot-snap') as unknown as
    | InjectedMetamaskExtension
    | undefined;
}

export interface SnapInitializationResponse {
  isSnapInstalled: boolean;
  snap?: MetamaskPolkadotSnap;
}

export async function initiatePolkadotSnap(): Promise<SnapInitializationResponse> {
  const snapId = process.env.REACT_APP_SNAP_ID ? process.env.REACT_APP_SNAP_ID : defaultSnapId;

  try {
    console.info('Attempting to connect to snap...');
    const metamaskPolkadotSnap = await enablePolkadotSnap({ networkName: 'westend' }, snapId);
    console.info('Snap installed!');
    return { isSnapInstalled: true, snap: metamaskPolkadotSnap };
  } catch (e) {
    console.error(e);
    return { isSnapInstalled: false };
  }
}

export const useAvailSnap = () => {
  const dispatch = useAppDispatch();
  const { loader } = useAppSelector((state: any) => state.UI);
  const { transactions, erc20TokenBalances, provider } = useAppSelector(
    (state: any) => state.wallet
  );
  const snapId = process.env.REACT_APP_SNAP_ID
    ? process.env.REACT_APP_SNAP_ID
    : 'local:http://localhost:8081/';
  const snapVersion = process.env.REACT_APP_SNAP_VERSION ? process.env.REACT_APP_SNAP_VERSION : '*';
  const debugLevel =
    process.env.REACT_APP_DEBUG_LEVEL !== undefined ? process.env.REACT_APP_DEBUG_LEVEL : 'all';

  const defaultParam = {
    debugLevel
  };

  const connectToSnap = () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    provider
      .request({
        method: 'wallet_requestSnaps',
        params: {
          [snapId]: { version: snapVersion }
        }
      })
      .then(() => {
        dispatch(setWalletConnection(true));
        dispatch(setForceReconnect(false));
      })
      .catch(() => {
        dispatch(setWalletConnection(false));
        dispatch(disableLoading());
      });
  };

  const getNetworks = async () => {
    const data = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_getStoredNetworks',
          params: {
            ...defaultParam
          }
        }
      }
    })) as Network[];
    return data;
  };

  const getCurrentNetwork = async () => {
    try {
      return await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getCurrentNetwork',
            params: {
              ...defaultParam
            }
          }
        }
      });
    } catch (err) {
      throw err;
    }
  };

  const oldVersionDetected = async () => {
    // const snaps = await provider.request({ method: 'wallet_getSnaps' });
    // if (typeof snaps[snapId]?.version !== 'undefined') {
    //   // console.log(`snaps[snapId][version]: ${snaps[snapId]?.version}`);
    //   // console.log(`snaps[snapId][version].split('_')[0]: ${snaps[snapId]?.version?.split('-')?.[0]}`);
    //   // console.log(`minSnapVersion: ${minSnapVersion}`);
    //   // console.log(`semver.lt: ${semver.lt(snaps[snapId]?.version?.split('-')?.[0], minSnapVersion)}`);
    //   return semver.lt(snaps[snapId]?.version?.split('-')?.[0], minSnapVersion);
    // }
    return false;
  };

  const getTokens = async (chainId: string) => {
    const tokens = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_getStoredErc20Tokens',
          params: {
            ...defaultParam,
            chainId
          }
        }
      }
    })) as Erc20Token[];
    return tokens;
  };

  const recoverAccounts = async (chainId: string) => {
    const START_SCAN_INDEX = 0;
    const MAX_SCANNED = 1;
    const MAX_MISSED = 1;
    const scannedAccounts = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_recoverAccounts',
          params: {
            ...defaultParam,
            startScanIndex: START_SCAN_INDEX,
            maxScanned: MAX_SCANNED,
            maxMissed: MAX_MISSED,
            chainId
          }
        }
      }
    })) as Account[];
    return scannedAccounts;
  };

  const addAccount = async (chainId: string) => {
    const data = (await provider.request({
      method: 'wallet_invokeSnap',
      params: {
        snapId,
        request: {
          method: 'starkNet_createAccount',
          params: {
            ...defaultParam,
            addressIndex: 0,
            chainId,
            deploy: false
          }
        }
      }
    })) as Account;
    return data;
  };

  const getTokenBalance = async (tokenAddress: string, userAddress: string, chainId: string) => {
    try {
      const response = await provider.request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'starkNet_getErc20TokenBalance',
            params: {
              ...defaultParam,
              tokenAddress,
              userAddress,
              chainId
            }
          }
        }
      });
      return response;
    } catch (err) {
      //eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const setErc20TokenBalance = (erc20TokenBalance: Erc20TokenBalance) => {
    dispatch(setErc20TokenBalanceSelected(erc20TokenBalance));
  };

  const getWalletData = async (chainId: string, networks?: Network[]) => {
    if (!loader.isLoading && !networks) {
      dispatch(enableLoadingWithMessage('Getting network data ...'));
    }
    const tokens = await getTokens(chainId);
    let acc: Account[] | Account = await recoverAccounts(chainId);
    if (!acc || acc.length === 0 || !acc[0].publicKey) {
      acc = await addAccount(chainId);
    }
    const tokenBalances = await Promise.all(
      tokens.map(async (token) => {
        const accountAddr = Array.isArray(acc) ? acc[0].address : acc.address;
        return await getTokenBalance(token.address, accountAddr, chainId);
      })
    );

    const tokenUSDPrices = await Promise.all(
      tokens.map(async (token) => {
        // return await getAssetPriceUSD(token);
        return 0;
      })
    );

    // const tokensWithBalances = tokens.map((token, index): Erc20TokenBalance => {
    //   return addMissingPropertiesToToken(token, tokenBalances[index], tokenUSDPrices[index]);
    // });
    if (networks) {
      dispatch(setNetworks(networks));
    }
    // dispatch(setErc20TokenBalances(tokensWithBalances));
    // dispatch(setAccounts(acc));
    // if (tokensWithBalances.length > 0) {
    //   setErc20TokenBalance(tokensWithBalances[0]);
    // }
    if (!Array.isArray(acc)) {
      dispatch(setInfoModalVisible(true));
    }
    dispatch(disableLoading());
  };

  const initSnap = async () => {
    // if (await oldVersionDetected()) {
    //   dispatch(setMinVersionModalVisible(true));
    //   dispatch(disableLoading());
    //   return;
    // }
    if (!loader.isLoading) {
      dispatch(enableLoadingWithMessage('Initializing wallet ...'));
    }
    try {
      const nets = await getNetworks();
      if (nets.length === 0) {
        return;
      }
      const net = await getCurrentNetwork();
      const idx = nets.findIndex((e) => e.chainId === net.chainId);
      dispatch(setActiveNetwork(idx));
      const chainId = net.chainId;
      await getWalletData(chainId, nets);
    } catch (err: any) {
      if (err.code && err.code === 4100) {
        const toastr = new Toastr();
        toastr.error('Snap is unaccessible or unauthorized');
        dispatch(setWalletConnection(false));
      }
      if (err.code && err.code === -32603) {
        dispatch(setMinVersionModalVisible(true));
      }
      //eslint-disable-next-line no-console
      console.error('Error while Initializing wallet', err);
    } finally {
      dispatch(disableLoading());
    }
  };

  const checkConnection = () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    provider
      .request({
        method: 'wallet_invokeSnap',
        params: {
          snapId,
          request: {
            method: 'ping',
            params: {
              ...defaultParam
            }
          }
        }
      })
      .then(() => {
        console.log('Set Wallet connection true');
        dispatch(setWalletConnection(true));
      })
      .catch((err: any) => {
        console.log('Set Wallet connection false');
        dispatch(setWalletConnection(false));
        dispatch(disableLoading());
        //eslint-disable-next-line no-console
        console.log(err);
      });
  };

  return {
    connectToSnap,
    getNetworks,
    getCurrentNetwork,
    satisfiesVersion: oldVersionDetected,
    getWalletData,
    initSnap,
    checkConnection
  };
};
