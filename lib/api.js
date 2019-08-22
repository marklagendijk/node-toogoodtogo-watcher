const config = require('./config');
const request = require('request-promise').defaults({
    method: 'POST',
    baseUrl: 'https://apptoogoodtogo.com/index.php/api_tgtg',
    json: true,
    headers: config.get('headers')
});
const session = {};

module.exports = {
    login,
    listFavoriteBusinesses
};

function login({ email, password }){
    return request({
        url: '/login',
        form: { email, password }
    }).then(createSession);
}

function createSession(user){
    session.user = user
    return user;
}

function listFavoriteBusinesses(user = session.user){
    return request({
        url: '/list_favorite_businessesv5',
        form: {
            user_id: user.user_id,
            user_token: user.user_token
        }
    })
}