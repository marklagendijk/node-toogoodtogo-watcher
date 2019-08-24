const Conf = require('conf');
const editor = require('editor');

const defaults = {
    api: {
        credentials: {
            email: 'Email of your TooGoodToGo account.',
            password: 'Password of your TooGoodToGo account.'
        },
        headers: {
            'User-Agent': 'TGTG/19.6.0 (637) (Android/Unknown; Scale/3.00)'
        },
        pollingIntervalInMs: 30000
    },
    notifications: {
        console: {
            enabled: true,
            clear: true
        },
        desktop: {
            enabled: true
        },
        telegram: {
            enabled: false,
            botToken: 'See README',
            chats: {}
        }
    }
};

const config = new Conf({ defaults });

module.exports = {
    config,
    editConfig,
    resetConfig
};

function editConfig(){
    editor(config.path)
}

function resetConfig(){
    config.set(defaults);
}