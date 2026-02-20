require('chai').should();

const web3Utils = require('../services/web3-utils');

describe('Web3 Utils Testing', () => {
  it('Test connection to service', () => {
    const connectionTest = web3Utils.testConnection();
    connectionTest.should.equal('...web3 connection successful');
  });

  describe('Unit Converstions', () => {
    it('Convert hex to decimal', () => {
      const hex = '0x1000000000000000000';
      const decimal = web3Utils.convert(hex, 'hex', 'dec');
      decimal.should.equal('4722366482869645213696')
    });

    it('Convert decimal to hex', () => {
      const decimal = '4722366482869645213696';
      const hex = web3Utils.convert(decimal, 'dec', 'hex');
      hex.should.equal('0x1000000000000000000');
    });

    it('Convert ether to wei', () => {
      const ether = '1';
      const wei = web3Utils.convert(ether, 'ether', 'wei');
      wei.should.equal('1000000000000000000');
    });

    it('Convert wei to ether', () => {
      const wei = '1000000000000000000';
      const ether = web3Utils.convert(wei, 'wei', 'ether');
      ether.should.equal('1');
    });

    it('Convert anything to invalid units returns error', () => {
      const value = '1';
      const targetUnits = 'invalid';
      const result = web3Utils.convert(value, 'ether', targetUnits);
      result.should.equal(`invalid target units:${targetUnits}`);
    });
  });

});