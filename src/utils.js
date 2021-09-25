const Web3 = require('web3');
const BN = require('bn.js');

const web3 = new Web3();

module.exports = {
    getEmoji(amount) {
        if (amount.lt(web3.utils.toWei(new BN('5')))) {
            return {type: 0, emoji: "🦐"};
        }

        if (amount.gte(web3.utils.toWei(new BN('5'))) &&  amount.lt(web3.utils.toWei(new BN('10')))) {
            return {type: 1, emoji: "🐟"};
        }

        return {type: 2, emoji: "🐳"};
    },
    getAmountEmoji(amount, dealType) {
        if (amount.lt(web3.utils.toWei(new BN('5')))) {
            return dealType === 'buy' ? "💰" : '💸';
        }

        if (amount.gte(web3.utils.toWei(new BN('5'))) && amount.lt(web3.utils.toWei(new BN('10')))) {
            return dealType === 'buy' ? "💰".repeat(2) : '💸'.repeat(2);
        }

        if (amount.gte(web3.utils.toWei(new BN('10'))) && amount.lt(web3.utils.toWei(new BN('50')))) {
            const repeatCount = Math.ceil(web3.utils.fromWei(amount.toString()) / 5) + 1 ;
            return dealType === 'buy' ? "💰".repeat(repeatCount) : '💸'.repeat(repeatCount);
        }

        return dealType === 'buy' ? "💰".repeat(12) : '💸'.repeat(12);
    },
    formatDecimals(stringWei, precision = 6) {
        return Number(stringWei).toFixed(precision);
    }
}