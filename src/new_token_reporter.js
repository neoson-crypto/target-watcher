const Web3 = require('web3');
const ERC20ABI = require('../abi/erc20.json');
const TelegramBot = require("node-telegram-bot-api");

const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://arb1.arbitrum.io/ws'));
const telegramBotKey = process.env.BOT_KEY;
const chatId = process.env.NEW_TOKEN_CHANNEL;

const bot = new TelegramBot(telegramBotKey);

(async () => {
    web3.eth.subscribe('newBlockHeaders')
        .on("connected", function (subscriptionId) {
            console.log(`new token connected: ${subscriptionId}`);
        })
        .on('data', function ({number}) {
            if (number) {
                web3.eth.getBlock(number, true)
                    .then(async ({transactions}) => {
                        for (const transaction of transactions) {
                            if (!transaction.to) {
                                // contract creation
                                const {contractAddress} = await web3.eth.getTransactionReceipt(transaction.hash);
                                const newContract = new web3.eth.Contract(ERC20ABI, contractAddress);
                                try {
                                    const name = await newContract.methods.name().call();
                                    const symbol = await newContract.methods.symbol().call();
                                    await newContract.methods.decimals().call();
                                    await newContract.methods.totalSupply().call();

                                    // erc20, report it
                                    const msg = `新币来啦 小心冲哦\n`
                                        + `被rug是哭都没泪 💸\n\n`
                                        + `代币: $<code>${name}</code>(<code>${symbol}</code>)\n`
                                        + `合约地址: <code>${contractAddress}</code>\n`
                                        + `合约创作者: <code>${transaction.from}</code>\n`
                                        + `链接: <a href="https://arbiscan.io/address/${contractAddress}">link</a>`;

                                    bot.sendMessage(chatId, msg, {disable_web_page_preview: true, parse_mode: 'HTML'});
                                } catch (e) {
                                    // not erc20, ignore
                                }
                            }
                        }
                    })
            }
        })
        .on('error', () => process.exit(1));
})();