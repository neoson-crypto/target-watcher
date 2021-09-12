require('dotenv').config();
const Web3 = require('web3');
const Uniswapv2Pair = require('../../abi/uniswapv2Pair.json');
const StakeABI = require('../../abi/stakeABI.json');
const UniswapV2ABI = require("../../abi/uniswapv2ABI.json");
const TelegramBot = require("node-telegram-bot-api");
const targets = require('../targets.json');

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://arb1.arbitrum.io/ws'));
const poolAddr = '0x70df9dd83be2a9f9fcc58dd7c00d032d007b7859';
const sushiRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const threshold = '1'; // eth
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.NYAN_TRADE_CHANNEL;
const babaChatId = process.env.NYAN_BABA_CHANNEL;
const ethStakeAddr = '0x9F7968de728aC7A6769141F63dCA03FD8b03A76F';
const nyanStakeAddr = '0x32e5594f14de658b0d577d6560fa0d9c6f1aa724';

const bot = new TelegramBot(telegramBotKey);
const sushiRouterContract = new web3.eth.Contract(UniswapV2ABI, sushiRouter);

function getEmoji(amount) {
    if (Number(amount) >= web3.utils.toWei('10')) {
        return "🐳";
    }

    if (Number(amount) >= web3.utils.toWei('5')) {
        return "🐟";
    }

    return "🦐";
}

(async () => {
    const poolContract = new web3.eth.Contract(Uniswapv2Pair, poolAddr);
    const ethStakeContract = new web3.eth.Contract(StakeABI, ethStakeAddr);
    const nyanStakeContract = new web3.eth.Contract(StakeABI, nyanStakeAddr);

    ethStakeContract.events.RewardPaid()
        .on("connected", function (subscriptionId) {
            console.log(`nyan eth Stake RewardPaid connected: ${subscriptionId}`);
        })
        .on('data', async function ({returnValues, transactionHash}) {
            const found = targets.find((target) => target.address.toLowerCase() === returnValues.user.toLowerCase());
            if (found) {
                const out = await sushiRouterContract.methods.getAmountsOut(returnValues.reward, ['0xed3fb761414da74b74f33e5c5a1f78104b188dfc', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1']).call();

                const msg = `🤬 重要！${found.alias}收割了 🤬\n`
                    + `乐观点，收割进二池\n`
                    + `悲哀点，他准备砸了\n`
                    + `看到这信息, 你应该还有3秒时间操作\n`
                    + `收割: +<code>${Number(web3.utils.fromWei(returnValues.reward)).toFixed(6)}</code> NYAN\n`
                    + `价值: ${Number(web3.utils.fromWei(out[1])).toFixed(6)} ETH\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(babaChatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', () => process.exit(1));

    nyanStakeContract.events.RewardPaid()
        .on("connected", function (subscriptionId) {
            console.log(`nyan Stake RewardPaid connected: ${subscriptionId}`);
        })
        .on('data', async function ({returnValues, transactionHash}) {
            const found = targets.find((target) => target.address.toLowerCase() === returnValues.user.toLowerCase());
            if (found) {
                const out = await sushiRouterContract.methods.getAmountsOut(returnValues.reward, ['0xed3fb761414da74b74f33e5c5a1f78104b188dfc', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1']).call();

                const msg = `🤬 重要！${found.alias}收割了 🤬\n`
                    + `乐观点，收割进二池\n`
                    + `悲哀点，他准备砸了\n`
                    + `看到这信息, 你应该还有3秒时间操作\n`
                    + `收割: +<code>${Number(web3.utils.fromWei(returnValues.reward)).toFixed(6)}</code> NYAN\n`
                    + `价值: ${Number(web3.utils.fromWei(out[1])).toFixed(6)} ETH\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(babaChatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', () => process.exit(1));

    poolContract.events.Swap()
        .on("connected", function (subscriptionId) {
            console.log(`nyan swap connected: ${subscriptionId}`);
        })
        .on('data', async function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0Out) > 0) {
                // nyan > eth (sell nyan)

                // search for target
                const {from} = await web3.eth.getTransactionReceipt(transactionHash);
                const found = targets.find((target) => target.address.toLowerCase() === from.toLowerCase());
                if (found) {
                    // target sell, warning
                    const msg = `🤬 重要！${found.alias}rug了！默哀3秒钟 🤬\n`
                        + `出: -<code>${Number(web3.utils.fromWei(returnValues.amount1In)).toFixed(6)}</code> NYAN\n`
                        + `收: +<code>${Number(web3.utils.fromWei(returnValues.amount0Out)).toFixed(6)}</code> ETH\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(babaChatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }

                if (Number(returnValues.amount0Out) >= web3.utils.toWei(threshold)) {
                    // sell more than 1 eth
                    const msg = `💸 惨了！大户出货了！${getEmoji(returnValues.amount0Out)}\n`
                        + `出: -<code>${Number(web3.utils.fromWei(returnValues.amount1In)).toFixed(6)}</code> NYAN\n`
                        + `收: +<code>${Number(web3.utils.fromWei(returnValues.amount0Out)).toFixed(6)}</code> ETH\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            } else {
                // eth > nyan (buy nyan)
                // check buy eth amount
                if (Number(returnValues.amount0In) >= web3.utils.toWei(threshold)) {
                    const msg = `💰 冲！冲！冲！大户买货啦！${getEmoji(returnValues.amount0In)}\n`
                        + `出: -<code>${Number(web3.utils.fromWei(returnValues.amount0In)).toFixed(6)}</code> ETH\n`
                        + `收: +<code>${Number(web3.utils.fromWei(returnValues.amount1Out)).toFixed(6)}</code> NYAN\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            }
        })
        .on('error', () => process.exit(1));

    poolContract.events.Mint()
        .on("connected", function (subscriptionId) {
            console.log(`nyan mint connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0) >= web3.utils.toWei(threshold)) {
                // added more than 1 eth liquidity
                const msg = `🎅🏻 我草！大户竟然进二池当矿！${getEmoji(returnValues.amount0)}\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount0)).toFixed(6)}</code> ETH\n`
                    + `+<code>${Number(web3.utils.fromWei(returnValues.amount1)).toFixed(6)}</code> NYAN\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', () => process.exit(1));

    poolContract.events.Burn()
        .on("connected", function (subscriptionId) {
            console.log(`nyan burn connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            if (Number(returnValues.amount0) >= web3.utils.toWei(threshold)) {
                // removed more than 1 eth liquidity
                const msg = `🏃🏻‍♂️ 溜了溜了！大户从二池逃出来了！${getEmoji(returnValues.amount0)}\n`
                    + `-<code>${Number(web3.utils.fromWei(returnValues.amount0)).toFixed(6)}</code> ETH\n`
                    + `-<code>${Number(web3.utils.fromWei(returnValues.amount1)).toFixed(6)}</code> NYAN\n`
                    + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
            }
        })
        .on('error', () => process.exit(1));
})();