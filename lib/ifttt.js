const {config} = require('./config');

const request = require('request-promise').defaults({
    method: 'POST',
    baseUrl: 'https://maker.ifttt.com/trigger'
});

module.exports = {
    notifyIFTTT
};

function notifyIFTTT(message) {
    return request({
        url: `/${config.get('notifications.ifttt.webhookEvent')}/with/key/${config.get('notifications.ifttt.webhookKey')}`,
        json: {
            value1: message
        }
    });
}
