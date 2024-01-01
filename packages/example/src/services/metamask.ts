import { web3EnablePromise } from '@polkadot/extension-dapp';
import { useAppDispatch, useAppSelector } from 'hooks/redux';
import { Network, VoyagerTransactionType, Erc20TokenBalance, Erc20Token, Account } from '@types';
import type { InjectedMetamaskExtension } from '@avail/metamask-polkadot-adapter/src/types';
import type { InjectedExtension } from '@polkadot/extension-inject/types';
import { enablePolkadotSnap } from '@avail/metamask-polkadot-adapter';
import type { MetamaskPolkadotSnap } from '@avail/metamask-polkadot-adapter/build/snap';
import Toastr from 'toastr2';
import { setData } from 'slices/metamaskSlice';
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
    await enablePolkadotSnap({ networkName: 'avail' }, snapId);
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
  console.log('Extensions are: ', extensions);
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
    const metamaskPolkadotSnap = await enablePolkadotSnap({ networkName: 'avail' }, snapId);
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
  const { accounts, transactions, erc20TokenBalances, provider } = useAppSelector(
    (state) => state.wallet
  );
  const metamaskState = useAppSelector((state) => state.metamask);
  const networkState = useAppSelector((state) => state.network);
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
    return [
      {
        name: 'Avail Mainnet',
        chainId: '1'
      },
      {
        name: 'Goldberg Testnet',
        chainId: '2'
      }
    ] as Network[];
  };

  const switchNetwork = async (chainId: string) => {
    dispatch(enableLoadingWithMessage('Switching Network...'));
    console.log('data is: ', networkState);
    if (metamaskState.hasMetaMask && !metamaskState.polkadotSnap.api) {
      console.log('data is: ', networkState);
      // if (networkName === network) return;
      // await metamaskState.polkadotSnap.api.setConfiguration({ networkName: networkName });
      return true;
    } else {
      dispatch(disableLoading());
      return false;
    }
  };

  const getCurrentNetwork = async () => {
    return networkState.items[networkState.activeNetwork];
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

  const getWalletData = async (chainId: string, networks?: Network[]) => {
    if (!loader.isLoading && !networks) {
      dispatch(enableLoadingWithMessage('Getting network data ...'));
    }

    const acc = [
      {
        address: metamaskState.polkadotSnap.address,
        publicKey: metamaskState.polkadotSnap.publicKey
      }
    ] as Account[];
    console.log('check account: ', metamaskState.polkadotSnap.address);
    console.log('check account: ', metamaskState.polkadotSnap.publicKey);
    // const tokens = await getTokens(chainId);
    // let acc: Account[] | Account = await recoverAccounts(chainId);
    // if (!acc || acc.length === 0 || !acc[0].publicKey) {
    //   acc = await addAccount(chainId);
    // }
    // const tokenBalances = await Promise.all(
    //   tokens.map(async (token) => {
    //     const accountAddr = Array.isArray(acc) ? acc[0].address : acc.address;
    //     return await getTokenBalance(token.address, accountAddr, chainId);
    //   })
    // );

    // const tokenUSDPrices = await Promise.all(
    //   tokens.map(async (token) => {
    //     // return await getAssetPriceUSD(token);
    //     return 0;
    //   })
    // );

    // const tokensWithBalances = tokens.map((token, index): Erc20TokenBalance => {
    //   return addMissingPropertiesToToken(token, tokenBalances[index], tokenUSDPrices[index]);
    // });
    if (networks) {
      dispatch(setNetworks(networks));
    }
    // dispatch(setErc20TokenBalances(tokensWithBalances));
    dispatch(setAccounts(acc));
    console.log('accounts are: ', acc);
    if (acc.length > 0) {
      setErc20TokenBalanceSelected({
        amount: metamaskState.polkadotSnap.balance
      } as Erc20TokenBalance);
    }
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
    const installResult = await initiatePolkadotSnap();
    if (!installResult.isSnapInstalled) {
      dispatch(
        setData({
          isInstalled: false,
          message: 'Please accept snap installation prompt'
        })
      );
    } else {
      const isInstalled = await isPolkadotSnapInstalled();
      console.log('is it installed Schi', isInstalled);
      // const api = installResult.snap?.getMetamaskSnapApi();
      // const addressData = await installResult.snap?.getMetamaskSnapApi().getAddress();
      dispatch(
        setData({
          isInstalled: true,
          snap: installResult.snap,
          address: await installResult.snap?.getMetamaskSnapApi().getAddress(),
          publicKey: await installResult.snap?.getMetamaskSnapApi().getPublicKey(),
          balance: await installResult.snap?.getMetamaskSnapApi().getBalance(),
          latestBlock: await installResult.snap?.getMetamaskSnapApi().getLatestBlock(),
          transactions: await installResult.snap?.getMetamaskSnapApi().getAllTransactions(),
          api: installResult.snap?.getMetamaskSnapApi()
        })
      );
      try {
        const nets = await getNetworks();
        if (nets.length === 0) {
          return;
        }
        const net = { chainId: '1' };
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
    }
  };

  const checkConnection = async () => {
    dispatch(enableLoadingWithMessage('Connecting...'));
    const isInstalled = await isPolkadotSnapInstalled();
    console.log('is it installed', isInstalled);
    if (isInstalled) {
      console.log('Set Wallet connection true');
      dispatch(setWalletConnection(true));
    } else {
      console.log('Set Wallet connection false');
      dispatch(setWalletConnection(false));
      dispatch(disableLoading());
    }
  };

  const getPrivateKeyFromAddress = async () => {
    if (!metamaskState.polkadotSnap.snap) return;
    const api = metamaskState.polkadotSnap.snap.getMetamaskSnapApi();
    const privateKey = await api.exportSeed();
    alert(privateKey);
  };

  return {
    connectToSnap,
    getNetworks,
    getCurrentNetwork,
    satisfiesVersion: oldVersionDetected,
    getWalletData,
    initSnap,
    checkConnection,
    getPrivateKeyFromAddress,
    switchNetwork
  };
};
