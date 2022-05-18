const express = require('express');
let bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const http = require('http').createServer(app);

const PORT = 5000;

let cors = require('cors');
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.options('/*', function (req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});

const Web3 = require('web3');
const ethers = require('ethers');

const { Uniswap2Contracts, Uniswap3Contracts, SushiswapContracts, ERC20Contracts } = require('./contract.js'); // Contract ABI
const { getBlock, gettimestamp } = require('./utils/common.util');

const provider = 'http://44.201.124.26:8545';

const web3Provider = new Web3.providers.HttpProvider(provider);
const web3 = new Web3(web3Provider);

const Uniswap2inter = new ethers.utils.Interface(Uniswap2Contracts.abi);
const Uniswap3inter = new ethers.utils.Interface(Uniswap3Contracts.abi);
const Sushiswapinter = new ethers.utils.Interface(SushiswapContracts.abi);

async function getTransactions(block, ind) {
  // const time = Number(new Date());

  try {
    console.log('Block is ', block);

    const block_ls = [];
    let timestamps = {};
    for (let i = block - 9; i <= block; i++) {
      block_ls.push(web3.eth.getBlock(i));
    }
    let block_rs = await Promise.all(block_ls);
    // console.log(block_rs);
    // console.log(block_rs.length, ' ----- ', +new Date() - time, 'ms');

    const tx_ls = [];

    for (let j = 0; j < block_rs.length; j++) {
      timestamps[block_rs[j].number] = block_rs[j].timestamp;
      let txs = block_rs[j].transactions;
      if (txs.length > 0) {
        for (let k = txs.length - 1; k >= 0; k--) {
          tx_ls.push(web3.eth.getTransaction(txs[k]));
        }
      }
    }
    const tx_rs = await Promise.all(tx_ls);
    console.log('tx_rs  =  ', tx_rs.length);
    return {
      tx: tx_rs,
      timestamp: timestamps,
    };
  } catch (error) {
    console.error(error);
  }
}

async function transaction(block, ind) {
  try {
    let returnData = {};
    let transactions = [];
    let counts = {
      uni2: 0,
      uni3: 0,
      sushi: 0,
    };

    do {
      const blockData = await getTransactions(block, ind);
      // console.log(blockData);
      const tx_rs = blockData.tx;
      const timestamps = blockData.timestamp;
      // console.log(tx_rs[i]);
      for (let i = tx_rs.length - 1; i >= ind; i--) {
        let inter = null;
        const data = {};
        if (tx_rs[i].to === Uniswap2Contracts.address) {
          inter = Uniswap2inter;
          data.name = 'UniV2';
          counts.uni2++;
        } else if (tx_rs[i].to === Uniswap3Contracts.address) {
          inter = Uniswap3inter;
          data.name = 'UniV3';
          counts.uni3++;
        } else if (tx_rs[i].to === SushiswapContracts.address) {
          inter = Sushiswapinter;
          data.name = 'Sushi';
          counts.sushi++;
        } else {
          continue;
        }

        const decodedInput = inter.parseTransaction({
          data: tx_rs[i].input,
          value: tx_rs[i].value,
        });

        if (
          decodedInput.name === 'exactInputSingle' ||
          decodedInput.name === 'multicall' ||
          decodedInput.name === 'removeLiquidityWithPermit' ||
          decodedInput.name === 'exactInput' ||
          decodedInput.name === 'removeLiquidityETHWithPermit' ||
          decodedInput.name === 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens' ||
          decodedInput.name === 'addLiquidityETH' ||
          decodedInput.name === 'exactOutput' ||
          decodedInput.name === 'exactOutputSingle' ||
          decodedInput.name === 'removeLiquidityETH'
        )
          continue;

        // console.log(tx_rs[i]);
        // console.log(decodedInput);
        // data.timestamp = gettimestamp(Number(decodedInput.args['deadline']));
        data.timestamp = gettimestamp(timestamps[tx_rs[i].blockNumber]);
        data.trade = decodedInput.name;
        // TODO: why here...
        // data.initialAsset = await getTokenSymbol(decodedInput.args["path"][0]);
        // data.finalAsset = await getTokenSymbol(de codedInput.args["path"][decodedInput.args["path"].length - 1]);
        data.initialAsset = decodedInput.args['path'][0];
        data.finalAsset = decodedInput.args['path'][decodedInput.args['path'].length - 1];
        if (decodedInput.name === 'swapExactETHForTokens') {
          data.initialAmount = tx_rs[i].value;
        } else {
          data.initialAmount = Number(decodedInput.args['amountIn']);
        }
        data.finalAmount = Number(decodedInput.args['amountOutMin']);
        if (decodedInput.name === 'swapTokensForExactTokens') {
          data.initialAmount = Number(decodedInput.args['amountInMax']);
          data.finalAmount = Number(decodedInput.args['amountOut']);
        }
        if (decodedInput.name === 'swapETHForExactTokens') {
          data.initialAmount = tx_rs[i].value;
          data.finalAmount = Number(decodedInput.args['amountOut']);
        }
        data.makerWallet = tx_rs[i].from;
        data.txnHash = tx_rs[i].hash;
        data.gasPrice = tx_rs[i].gas;
        data.blockNumber = tx_rs[i].blockNumber;
        transactions.push(data);
        if (transactions.length === 25) {
          returnData.ind = i;
          returnData.block = block;
          break;
        }
      }
      ind = 0;
      block = block - 10;
    } while (transactions.length < 25);

    // console.log('end    :   ', counts, '  --------------------  ', +new Date() - time, 'ms');
    console.log(transactions.length);

    returnData.transaction = transactions;
    return returnData;
  } catch (error) {
    console.log(error);
  }
}

app.use('/gettransaction', async (req, res) => {
  let params = req.query;
  let block = 0;
  let ind = 0;
  if (!params.block || params.block === 0) block = await getBlock();
  else block = params.block;
  if (!params.ind) ind = 0;
  else ind = params.ind;
  let tx = await transaction(block, ind);
  res.send(tx);
});
console.log(Number(new Date()));
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));
