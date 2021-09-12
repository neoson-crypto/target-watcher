require('dotenv').config();
const Web3 = require('web3');
const cron = require('node-cron');
const BN = require("bn.js");
const TelegramBot = require("node-telegram-bot-api");
const UniswapV2ABI = require("../abi/uniswapv2ABI.json");
const StakeABI = require("../abi/stakeABI.json");
const targets = require('./targets.json');

const web3 = new Web3('https://arb1.arbitrum.io/rpc');
const ethStakeAddr = '0x9f7968de728ac7a6769141f63dca03fd8b03a76f';
const nyanStakeAddr = '0x32e5594f14de658b0d577d6560fa0d9c6f1aa724';
const sushiRouter = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506';
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.NYAN_BABA_CHANNEL;

const bot = new TelegramBot(telegramBotKey);
const sushiRouterContract = new web3.eth.Contract(UniswapV2ABI, sushiRouter);

cron.schedule('*/10 * * * *', async () => {
    const ethContract = new web3.eth.Contract(StakeABI, ethStakeAddr);

    for (const target of targets) {
        const ethBalance = await ethContract.methods.earned(target.address).call();

        const nyanContract = new web3.eth.Contract(abi, nyanStakeAddr);
        const stakedBalance = await nyanContract.methods.balanceOf(target.address).call();
        const earnedBalance = await nyanContract.methods.earned(target.address).call();

        const total = new BN(ethBalance).add(new BN(stakedBalance)).add(new BN(earnedBalance));

        const out = await sushiRouterContract.methods.getAmountsOut(total, ['0xed3fb761414da74b74f33e5c5a1f78104b188dfc', '0x82af49447d8a07e3bd95bd0d56f35241523fbab1']).call();

        const msg = `${target.alias}\n` +
            `ETH池(未收割): ${Number(web3.utils.fromWei(ethBalance)).toFixed(6)} NYAN\n`
            + (Number(stakedBalance) > 0 ? `单池(已存): ${Number(web3.utils.fromWei(stakedBalance)).toFixed(6)} NYAN\n` : '')
            + (Number(earnedBalance) > 0 ? `单池(未收割): ${Number(web3.utils.fromWei(earnedBalance)).toFixed(6)} NYAN\n` : '')
            + `\n总数: ${Number(web3.utils.fromWei(total)).toFixed(6)} NYAN\n`
            + `价值: ${Number(web3.utils.fromWei(out[1])).toFixed(6)} ETH`;

        await bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
    }
}, {
    scheduled: true,
    timezone: "Asia/Singapore"
});