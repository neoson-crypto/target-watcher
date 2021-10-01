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

const projetName = 'MAGIC';

(async () => {
    timelockContract.events.QueueTransaction()
        .on("connected", function (subscriptionId) {
            console.log(`magic timelock queue monitor connected: ${subscriptionId}`);
        })
        .on('data', function ({returnValues, transactionHash}) {
            const method = returnValues.signature.split('(')[0].trim();
            const targetMethodAbi = MasterChefABI.find(x => x.name === method);
            const decoded = web3.eth.abi.decodeParameters(targetMethodAbi.inputs, returnValues.data);

            let msg = `${projetName} queued transaction \n`
                + `target: <pre>${returnValues.target}</pre>\n`
                + `method: <pre>${method}</pre>\n\n`
                + `Input data:\n`;

            for (let i = 0; i < decoded.__length__; i++) {
                msg += `<pre>${targetMethodAbi.inputs[i].name}: ${decoded[i]}</pre>\n`;
            }

            msg += `\neth send: <pre>${returnValues.value}</pre>\n`
                + `expected run on: <pre>${moment.unix(Number(returnValues.eta)).format('YYYY-MM-DD HH:mm:ss')}</pre>\n`
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

            const msg = `${projetName} executed transaction: \n`
                + `target: <pre>${returnValues.target}</pre>\n`
                + `method: <pre>${returnValues.signature}</pre>\n`
                + `executed on: <pre>${moment.unix(Number(blockData.timestamp)).format('YYYY-MM-DD HH:mm:ss')}</pre>\n`
                + `<a href="https://arbiscan.io/tx/${transactionHash}">link</a>`;

            bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
        })
        .on('error', () => process.exit(1));
})();