const ethers = require('ethers');
const Web3 = require('web3');
const { ERC20Contracts } = require('../contract');
const e = require('express');

const provider = 'http://44.201.124.26:8545';

const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

function fromBigNum(value, d) {
  return parseFloat(ethers.utils.formatUnits(value, d));
}

function toBigNum(value, d) {
  return ethers.utils.parseUnits(Number(value).toFixed(d), d);
}

async function getDatas(data) {
  const ls = [];
  for (let i = 0; i < data.length; i++) {
    ls.push(web3.eth.Contract(ERC20Contracts.abi, data[i].initialAsset));
    ls.push(web3.eth.Contract(ERC20Contracts.abi, data[i].finalAsset));
  }
  const rs = await Promise.all(ls);

  const tokenContract = new web3.eth.Contract(ERC20Contracts.abi, address);
  return await tokenContract.methods.symbol().call();
}

async function getBlock() {
  const blockNumber = await web3.eth.getBlockNumber();
  console.log('latest block is ', blockNumber);
  return blockNumber;
}

function gettimestamp(time) {
  let duration = Number(new Date()) - time * 1000;
  // let duration = time;
  let seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24),
    days = Math.floor(duration / (1000 * 60 * 60) / 24);

  let timestamp = '';
  if (days > 0) {
    timestamp += days;
    if (days > 1) timestamp += ' days ';
    else timestamp += ' day ';
  }
  if (hours > 0) {
    timestamp += hours;
    if (hours > 1) timestamp += ' hrs ';
    else timestamp += ' hr ';
  }
  if (minutes > 0) {
    timestamp += minutes;
    if (minutes > 1) timestamp += ' mins ';
    else timestamp += ' min ';
  }
  timestamp += seconds;
  if (seconds > 1) timestamp += ' secs ';
  else timestamp += ' sec ';

  timestamp += 'ago';

  return timestamp;
}

module.exports = {
  fromBigNum,
  toBigNum,
  getDatas,
  getBlock,
  gettimestamp,
};
