const { config } = require('./config');
const request = require('request-promise').defaults({
    method: 'POST',
    baseUrl: 'https://apptoogoodtogo.com/api',
    headers: config.get('api.headers')
});

module.exports = {
    login,
    listFavoriteBusinesses
};

function login(){
    const session = getSession();
    return session.refreshToken ?
        refreshToken():
        loginByEmail();
}

function loginByEmail(){
    const credentials = config.get('api.credentials');

    return request({
        url: '/auth/v1/loginByEmail',
        json: {
            device_type: "UNKNOWN",
            email: credentials.email,
            password: credentials.password
        },
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": "en-US"
        }
    }).then(createSession);
}

function refreshToken(){
    const session = getSession();

    return request({
        url: '/auth/v1/token/refresh',
        json: {
            refresh_token: session.refreshToken
        },
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": "en-US"
        }
    }).then(updateSession);
}

function listFavoriteBusinesses(){
    const session = getSession();

    return request({
        url: '/item/v4/',
        json: {
            favorites_only: true,
            origin: {
                latitude: 52.5170365,
                longitude: 13.3888599
            },
            radius: 200,
            user_id: session.userId
        },
        auth: {
            "bearer": session.accessToken,
          }
    })
}

function getSession(){
    return config.get('api.session') || {};
}

function createSession(login){
    config.set('api.session', {
        userId: login.startup_data.user.user_id,
        accessToken:  login.access_token,
        refreshToken: login.refresh_token
    });
    return login;
}

function updateSession(token){
    config.set('api.session.accessToken', token.access_token);
    return token;
}
