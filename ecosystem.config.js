module.exports = {
    apps: [
        {
            name: 'nyan_trade_reporter',
            script: 'src/nyan_trade_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
        {
            name: 'carbon_trade_reporter',
            script: 'src/carbon_trade_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
        {
            name: 'baba_reporter',
            script: 'src/baba_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },

        {
            name: 'new_token_reporter',
            script: 'src/new_token_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
    ],

    deploy: {
        production: {}
    }
};
