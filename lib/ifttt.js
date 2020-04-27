const {config} = require('./config');

const request = require('request-promise').defaults({
    method: 'GET',
    baseUrl: 'https://maker.ifttt.com/trigger'
});

module.exports = {
    notifyIFTTT
};

function notifyIFTTT() {
    return request({
        url: `/${config.get('notifications.ifttt.webhookEvent')}/with/key/${config.get('notifications.ifttt.webhookKey')}`
    });
}
