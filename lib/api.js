const { config } = require('./config');
const request = require('request-promise').defaults({
    method: 'POST',
    baseUrl: 'https://apptoogoodtogo.com/api',
    headers: config.get('api.headers')
});
const session = {};

module.exports = {
    login,
    refreshToken,
    listFavoriteBusinesses
};

function login(credentials = config.get('api.credentials')){
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

function refreshToken(refresh_token = session.refresh_token){
    if (refresh_token == undefined) {
      return login();
    }

    return request({
        url: '/auth/v1/token/refresh',
        json: {
            refresh_token: refresh_token
        },
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Language": "en-US"
        }
    }).then(updateSession);
}

function createSession(login){
    session.user_id = login.startup_data.user.user_id;
    session.access_token = login.access_token;
    session.refresh_token = login.refresh_token;
    return login;
}

function updateSession(token){
    session.refresh_token = token;
    return token;
}

function listFavoriteBusinesses(user_id = session.user_id, access_token = session.access_token){
    console.log("Poll")
    return request({
        url: '/item/v3/',
        json: {
            favorites_only: true,
            origin: {
                latitude: 52.5170365,
                longitude: 13.3888599
            },
            radius: 200,
            user_id: user_id
        },
        auth: {
            "bearer": access_token,
          }
    });
}
