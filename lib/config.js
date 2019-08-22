const Conf = require('conf');
module.exports = new Conf({
    defaults: {
        intervalInMs: 30000,
        headers: {
            "User-Agent": "TGTG/19.6.0 (637) (Android/Unknown; Scale/3.00)"
        }
    }
});