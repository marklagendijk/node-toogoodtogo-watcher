const { config } = require('./config');
const request = require('request-promise').defaults({
    method: 'POST',
    baseUrl: 'https://apptoogoodtogo.com/index.php/api_tgtg',
    json: true,
    headers: config.get('api.headers')
});
const session = {};

module.exports = {
    login,
    listFavoriteBusinesses
};

function login(credentials = config.get('api.credentials')){
    return request({
        url: '/login',
        form: { 
            email: credentials.email, 
            password: credentials.password 
        }
    })
        .then(handleError)
        .then(createSession);
}

function handleError(response){
    if(response.msg === 'OK'){
        return response;
    } else {
        throw new Error(response.msg);
    }
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
    }).then(handleError);
}