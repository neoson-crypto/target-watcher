require('dotenv').config();
const Web3 = require('web3');
const TimelockABI = require('../../abi/timelock.json');
const MasterChefABI = require('../../abi/MasterChefABI.json');
const TelegramBot = require("node-telegram-bot-api");
const moment = require('moment');

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://arb1.arbitrum.io/ws'));
const timelockAddr = '0xb261445eE14ac83d25996663C2e1365CEA35292A';
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.TIMELOCK_MONITOR_CHANNEL;

const bot = new TelegramBot(telegramBotKey);
const timelockContract = new web3.eth.Contract(TimelockABI, timelockAddr);

(async () => {
    timelockContract.events.QueueTransaction()
        .on("connected", function (subscriptionId) {
            console.log(`magic timelock queue monitor connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            const method = returnValues.signature.split('(')[0].trim();
            const targetMethodAbi = MasterChefABI.find(x => x.name === method);
            const decoded = web3.eth.abi.decodeParameter(targetMethodAbi.inputs, returnValues.data);

            let msg = `Queued transaction: \n`
                + `target: ${returnValues.target}\n`
                + `method: ${method}\n`
                + `Input data:\n`;

            for (let i = 0; i < decoded.__length__; i++) {
                msg += `${targetMethodAbi.inputs[i].name}: ${decoded[i]}\n`;
            }

            msg += `eth send: ${returnValues.value}\n`
                + `expected run on: ${moment(returnValues.eta).format('YYYY-MM-DD HH:mm:ss')}\n`
                + `<a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

            bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
        })
        .on('error', () => process.exit(1));

    timelockContract.events.ExecuteTransaction()
        .on("connected", function (subscriptionId) {
            console.log(`magic timelock execute monitor connected: ${subscriptionId}`);
        })
        .on('data', async function ({returnValues, transactionHash, blockNumber}) {
            const blockData = await web3.eth.getBlock(blockNumber);

            const msg = `Executed transaction: \n`
                + `target: ${returnValues.target}\n`
                + `method: ${returnValues.signature}\n`
                + `executed on: ${moment(blockData.timestamp).format('YYYY-MM-DD HH:mm:ss')}\n`
                + `<a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

            bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
        })
        .on('error', () => process.exit(1));
})();