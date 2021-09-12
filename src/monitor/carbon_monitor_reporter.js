require('dotenv').config();
const Web3 = require('web3');
const cron = require('node-cron');
const BN = require("bn.js");
const TelegramBot = require("node-telegram-bot-api");
const UniswapV2ABI = require("../../abi/uniswapv2ABI.json");
const StakeABI = require("../../abi/stakeABI.json");
const targets = require('../targets.json');

const web3 = new Web3('https://arb1.arbitrum.io/rpc');
const ethStakeAddr = '0x27F0408729dCC6A4672e1062f5003D2a07E4E10D';
const carbonStakeAddr = '0x2C5058325373d02Dfd6c08E48d91FcAf8fD49f45';
const sushiRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.MONITOR_REPORTER_CHANNEL;

const bot = new TelegramBot(telegramBotKey);
const sushiRouterContract = new web3.eth.Contract(UniswapV2ABI, sushiRouter);

cron.schedule('*/10 * * * *', async () => {
    const ethContract = new web3.eth.Contract(StakeABI, ethStakeAddr);

    for (const target of targets) {
        const ethBalance = await ethContract.methods.earned(target.address).call();

        const carbonContract = new web3.eth.Contract(StakeABI, carbonStakeAddr);
        const stakedBalance = await carbonContract.methods.balanceOf(target.address).call();
        const earnedBalance = await carbonContract.methods.earned(target.address).call();

        const total = new BN(ethBalance).add(new BN(stakedBalance)).add(new BN(earnedBalance));

        if (Number(total.toString()) <= 0) {
            continue;
        }

        const out = await sushiRouterContract.methods.getAmountsOut(total, ['0xed3fb761414da74b74f33e5c5a1f78104b188dfc', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1']).call();

        const msg = `${target.alias}\n` +
            `ETH池(未收割): ${Number(web3.utils.fromWei(ethBalance)).toFixed(6)} CARBON\n`
            + (Number(stakedBalance) > 0 ? `单池(已存): ${Number(web3.utils.fromWei(stakedBalance)).toFixed(6)} CARBON\n` : '')
            + (Number(earnedBalance) > 0 ? `单池(未收割): ${Number(web3.utils.fromWei(earnedBalance)).toFixed(6)} CARBON\n` : '')
            + `\n总数: ${Number(web3.utils.fromWei(total)).toFixed(6)} CARBON\n`
            + `价值: ${Number(web3.utils.fromWei(out[1])).toFixed(6)} ETH`;

        await bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
    }
}, {
    scheduled: true,
    timezone: "Asia/Singapore"
});