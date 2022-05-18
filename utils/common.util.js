const ethers = require('ethers');
const Web3 = require('web3');
const { ERC20Contracts } = require('../contract');
const e = require('express');

const provider = 'http://44.201.124.26:8545';
// const provider = 'http://127.0.0.1:8545';

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
    const tokenContract1 = new web3.eth.Contract(ERC20Contracts.abi, data[i].initialAssetAddress);
    const tokenContract2 = new web3.eth.Contract(ERC20Contracts.abi, data[i].finalAssetAddress);
    ls.push(tokenContract1.methods.symbol().call());
    ls.push(tokenContract2.methods.symbol().call());
    ls.push(tokenContract1.methods.decimals().call());
    ls.push(tokenContract2.methods.decimals().call());
  }
  const rs = await Promise.all(ls);

  for (let i = 0; i < rs.length; i = i + 4) {
    let ind = Math.floor(i / 4);
    let dec1 = Math.pow(10, Number(rs[i + 2]));
    let dec2 = Math.pow(10, Number(rs[i + 3]));
    data[ind].initialAssetSymbol = rs[i];
    data[ind].finalAssetSymbol = rs[i + 1];
    data[ind].initialAmount = Number(data[ind].initialAmount) / dec1;
    data[ind].finalAmount = Number(data[ind].finalAmount) / dec2;
  }
  return data;
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
