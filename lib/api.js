const _ = require("lodash");
const got = require("got");
const { config } = require("./config");

const api = got.extend({
  prefixUrl: "https://apptoogoodtogo.com/api/",
  headers: _.defaults(config.get("api.headers"), {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": "en-US",
  }),
  responseType: "json",
  resolveBodyOnly: true,
});

module.exports = {
  login,
  listFavoriteBusinesses,
};

function login() {
  const session = getSession();
  return session.refreshToken ? refreshToken() : loginByEmail();
}

function loginByEmail() {
  //const credentials = config.get("api.credentials");

  console.log(`Login using ${process.env.TGTG_EMAIL}...`);

  return api
    .post("auth/v2/loginByEmail", {
      json: {
        device_type: "UNKNOWN",
        email: process.env.TGTG_EMAIL,
        password: process.env.TGTG_PASSWORD,
      },
    })
    .then(createSession);
}

function refreshToken() {
  const session = getSession();

  return api
    .post("auth/v2/token/refresh", {
      json: {
        refresh_token: session.refreshToken,
      },
    })
    .then(updateSession);
}

function listFavoriteBusinesses() {
  const session = getSession();

  return api.post("item/v6/", {
    json: {
      favorites_only: true,
      origin: {
        latitude: 52.5170365,
        longitude: 13.3888599,
      },
      radius: 200,
      user_id: session.userId,
    },
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}

function getSession() {
  return config.get("api.session") || {};
}

function createSession(login) {
  console.log("Creating session...");

  config.set("api.session", {
    userId: login.startup_data.user.user_id,
    accessToken: login.access_token,
    refreshToken: login.refresh_token,
  });

  console.log("Done.");
  return login;
}

function updateSession(token) {
  config.set("api.session.accessToken", token.access_token);
  return token;
}
