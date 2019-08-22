const { pollFavoriteBusinesses } = require('./lib/poller');
const { notifyIfChanged } = require('./lib/notifier');

pollFavoriteBusinesses({
    email: '',
    password: '',
    intervalInMs: 30000
}).subscribe(businesses => {
    const message = businesses
        .map(business => `${ business.business_name } - ${business.todays_stock}`)
        .join('\n');
    notifyIfChanged(message);
})