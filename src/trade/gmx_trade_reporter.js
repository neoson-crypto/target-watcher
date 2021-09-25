require('dotenv').config();
const Web3 = require('web3');
const Uniswapv3Pair = require('../../abi/uniswapv3Pair.json');
const {getEmoji, getAmountEmoji, formatDecimals} = require('../utils');
const TelegramBot = require("node-telegram-bot-api");
const BN = require("bn.js");
const cron = require("node-cron");
const axios = require('axios');

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://arb1.arbitrum.io/ws'));

const poolAddr = '0x80A9ae39310abf666A87C743d6ebBD0E8C42158E';
const threshold = '1'; // eth
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.GMX_TRADE_CHANNEL;
// token 0 = eth
// token 1 = gmx
const ethToken = 'amount0';
const token = 'amount1';
const tokenSymbol = 'GMX';

const bot = new TelegramBot(telegramBotKey);
const poolContract = new web3.eth.Contract(Uniswapv3Pair, poolAddr);

// mutable state
let ethPrice;

function getText(dealType, amount) {
    const emojiData = getEmoji(amount);

    if (emojiData.type === 2) {
        return dealType === 'buy' ? `${getAmountEmoji(amount, dealType)} 巨鲸扫货了 车已进入高速公路 ${emojiData.emoji}` : `${getAmountEmoji(amount, dealType)} 巨鲸忍痛割爱了 稳住啊兄弟们 ${emojiData.emoji}`;
    }

    if (emojiData.type === 1) {
        return dealType === 'buy' ? `${getAmountEmoji(amount, dealType)} 小鱼购物完毕 现在上车还来得及 ${emojiData.emoji}` : `${getAmountEmoji(amount, dealType)} 小鱼中途下车了 问题大吗？不大 ${emojiData.emoji}`;
    }

    return dealType === 'buy' ? `${getAmountEmoji(amount, dealType)} 小虾米也来凑热闹 车还在等人 ${emojiData.emoji}` : `${getAmountEmoji(amount, dealType)} 小虾米还没开车就下车了 鄙视你 ${emojiData.emoji}`;
}

async function fetchEthPricing() {
    try {
        const price = await axios.get('https://api.etherscan.io/api?module=stats&action=ethprice');
        if (price.data.result.ethusd) {
            ethPrice = new BN(web3.utils.toWei(price.data.result.ethusd));
        }
    } catch (e) {
        // might be error sometimes, just ignore
        console.log(`fetch eth: ${e.message}`);
    }
}

function ethToUsdPrice(tokenAmount, ethAmount) {
    const tokenPrice = ethAmount.abs()
        .mul(new BN('1000000000000000000'))
        .div(tokenAmount.abs())
        .mul(ethPrice)
        .div(new BN('1000000000000000000'))
        .toString();

    return formatDecimals(
        web3.utils.fromWei(tokenPrice)
    );
}

(async () => {
    await fetchEthPricing();

    poolContract.events.Swap()
        .on("connected", function (subscriptionId) {
            console.log(`gmx swap connected: ${subscriptionId}`);
        })
        .on('data', async function ({returnValues, transactionHash}) {
            const amount0 = new BN(returnValues[ethToken]);
            const amount1 = new BN(returnValues[token]);

            if (amount0.ltn(0)) {
                // token > eth
                if (amount0.abs().gte(web3.utils.toWei(new BN(threshold)))) {
                    // sell more than 1 eth
                    const msg = `${getText('sell', amount0.abs())}\n`
                        + (ethPrice ? `当前价格: 1 ${tokenSymbol} = $${ethToUsdPrice(amount1, amount0)}\n` : '')
                        + `出: -<code>${formatDecimals(web3.utils.fromWei(amount1.abs().toString()))}</code> ${tokenSymbol}\n`
                        + `收: +<code>${formatDecimals(web3.utils.fromWei(amount0.abs().toString()))}</code> ETH\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            } else {
                // eth > token
                if (amount0.gte(web3.utils.toWei(new BN(threshold)))) {
                    const msg = `${getText('buy', amount0)}\n`
                        + (ethPrice ? `当前价格: 1 ${tokenSymbol} = $${ethToUsdPrice(amount1, amount0)}\n` : '')
                        + `出: -<code>${formatDecimals(web3.utils.fromWei(amount0.abs().toString()))}</code> ETH\n`
                        + `收: +<code>${formatDecimals(web3.utils.fromWei(amount1.abs().toString()))}</code> ${tokenSymbol}\n`
                        + `链接: <a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                }
            }
        })
        .on('error', () => process.exit(1));
})();

cron.schedule('*/30 * * * * *', async () => {
    await fetchEthPricing();
}, {
    scheduled: true,
    timezone: "Asia/Singapore"
});