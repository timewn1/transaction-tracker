const ethers = require('ethers');
const Web3 = require('web3');
const { ERC20Contracts } = require('../contract');

const provider = 'http://44.201.124.26:8545';

const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);


function fromBigNum(value, d) {
  return parseFloat(ethers.utils.formatUnits(value, d));
}

function toBigNum(value, d) {
  return ethers.utils.parseUnits(Number(value).toFixed(d), d);
}

async function getTokenSymbol(address) {
  const tokenContract = new web3.eth.Contract(ERC20Contracts.abi, address);
  return await tokenContract.methods.symbol().call();
}

async function getBlock() {
  return await web3.eth.getBlockNumber();
}

module.exports = {
  fromBigNum,
  toBigNum,
  getTokenSymbol,
  getBlock
}
