import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { getAddress } from '../../../src/rpc/getAddress';
import { defaultConfiguration } from '../../../src/configuration/predefined';
import { getWalletMock } from '../wallet.mock';
import { testAppKey, testAddress } from './keyPairTestConstants';

chai.use(sinonChai);

describe('Test rpc handler function: getAddress', function () {
  const walletStub = getWalletMock();

  afterEach(function () {
    walletStub.reset();
  });

  it('should return valid address with westend configuration', async function () {
    walletStub.request.onFirstCall().returns({ configuration: defaultConfiguration });
    walletStub.request.onSecondCall().returns({ privateKey: testAppKey });
    const result = await getAddress();
    expect(result).to.be.eq(testAddress);
  });
});
