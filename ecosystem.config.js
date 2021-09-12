module.exports = {
    apps: [
        {
            name: 'nyan_trade_reporter',
            script: 'src/trade/nyan_trade_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
        {
            name: 'carbon_trade_reporter',
            script: 'src/trade/carbon_trade_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
        {
            name: 'nyan_monitor_reporter',
            script: 'src/monitor/nyan_monitor_reporter.js',
            instances: 1,
            watch: false,
            autorestart: true,
        },
        {
            name: 'carbon_monitor_reporter',
            script: 'src/monitor/carbon_monitor_reporter.js',
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
