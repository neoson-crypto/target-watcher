const Web3 = require('web3');
const Uniswapv2Pair = require('./abi/uniswapv2ABI.json');
const TelegramBot = require("node-telegram-bot-api");

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://arb1.arbitrum.io/ws'));
const poolAddr = '0x70df9dd83be2a9f9fcc58dd7c00d032d007b7859';
const threshold = '1'; // eth
const telegramBotKey = '';
const chatId = '';

const bot = new TelegramBot(telegramBotKey);


(() => {
    const poolContract = new web3.eth.Contract(Uniswapv2Pair, poolAddr);

    poolContract.events.Swap()
        .on("connected", function (subscriptionId) {
            console.log(`swap connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0Out) > 0) {
                // nyan > eth (sell nyan)
                if (Number(returnValues.amount0Out) >= web3.utils.toWei(threshold)) {
                    // sell more than 1 eth
                    const msg = `惨了！大户出货了！\n`
                        + `出: -<code>${Number(web3.utils.fromWei(returnValues.amount1In)).toFixed(6)}</code> NYAN\n`
                        + `收: +<code>${Number(web3.utils.fromWei(returnValues.amount0Out)).toFixed(6)}</code> ETH\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            } else {
                // eth > nyan (buy nyan)
                // check buy eth amount
                if (Number(returnValues.amount0In) >= web3.utils.toWei(threshold)) {
                    const msg = `冲！冲！冲！大户买货啦！\n`
                        + `出: -<code>${Number(web3.utils.fromWei(returnValues.amount0In)).toFixed(6)}</code> ETH\n`
                        + `收: +<code>${Number(web3.utils.fromWei(returnValues.amount1Out)).toFixed(6)}</code> NYAN\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            }
        })
        .on('error', console.error);

    poolContract.events.Mint()
        .on("connected", function (subscriptionId) {
            console.log(`mint connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0) >= web3.utils.toWei(threshold)) {
                // added more than 1 eth liquidity
                const msg = `我草！大户竟然进二池当矿！\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount0)).toFixed(6)}</code> ETH\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount1)).toFixed(6)}</code> NYAN\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', console.error);

    poolContract.events.Burn()
        .on("connected", function (subscriptionId) {
            console.log(`burn connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0) >= web3.utils.toWei(threshold)) {
                // removed more than 1 eth liquidity
                const msg = `溜了溜了！大户从二池逃出来了！\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount0)).toFixed(6)}</code> ETH\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount1)).toFixed(6)}</code> NYAN\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', console.error);
})();