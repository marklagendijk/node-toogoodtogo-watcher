const { pollFavoriteBusinesses } = require('./lib/poller');
const { notifyIfChanged } = require('./lib/notifier');

pollFavoriteBusinesses().subscribe(businesses => {
    const message = businesses
        .map(business => `${ business.business_name } - ${business.todays_stock}`)
        .join('\n');
    notifyIfChanged(message);
})