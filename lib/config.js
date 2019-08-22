const { from, of } = require('rxjs');
const { prompt } = require('enquirer');
const Conf = require('conf');

const config = new Conf({
    defaults: {
        intervalInMs: 30000,
        headers: {
            "User-Agent": "TGTG/19.6.0 (637) (Android/Unknown; Scale/3.00)"
        }
    }
});

module.exports = {
    config,
    initConfig
};

function initConfig(){
    return config.has('email') && config.has('password') ?
        of(null) :    
        from(prompt([
            {
                name: 'email',
                type: 'input',
                message: 'Your TooGoodToGo account email'
            },
            {
                name: 'password',
                type: 'password',
                message: 'Your TooGoodToGo account password',
            }
        ]).then(credentials => config.set(credentials)));
}