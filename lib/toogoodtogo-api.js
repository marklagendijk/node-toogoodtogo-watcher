import _ from "lodash";
import got from "got";
import { CookieJar } from "tough-cookie";
import { config } from "./config.js";

const api = got.extend({
  cookieJar: new CookieJar(),
  prefixUrl: "https://apptoogoodtogo.com/api/",
  headers: _.defaults(config.get("api.headers"), {
    "User-Agent":
      "TooGoodToGo/21.9.0 (813) (iPhone/iPhone 7 (GSM); iOS 15.1; Scale/2.00)",
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
    "Accept-Language": "en-US",
    "Accept-Encoding": "gzip",
  }),
  responseType: "json",
  resolveBodyOnly: true,
  retry: {
    limit: 2,
    methods: ["GET", "POST", "PUT", "HEAD", "DELETE", "OPTIONS", "TRACE"],
    statusCodes: [401, 403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  },
});
export function authByEmail() {
  const credentials = config.get("api.credentials");

  return api.post("auth/v3/authByEmail", {
    json: {
      device_type: config.get("api.deviceType", "IOS"),
      email: credentials.email,
    },
  });
}

export function authPoll(polling_id) {
  const credentials = config.get("api.credentials");

  return api
    .post("auth/v3/authByRequestPollingId", {
      json: {
        device_type: config.get("api.deviceType", "IOS"),
        email: credentials.email,
        request_polling_id: polling_id,
      },
    })
    .then(createSession);
}

export function login() {
  const session = getSession();
  if (session.refreshToken) {
    return refreshToken();
  }
  throw "You are not logged in. Login via the command `toogoodtogo-watcher login` or `/login` with the Telegram Bot";
}

function refreshToken() {
  const session = getSession();

  return api
    .post("auth/v3/token/refresh", {
      json: {
        refresh_token: session.refreshToken,
      },
    })
    .then(updateSession);
}

export function listFavoriteBusinesses() {
  const session = getSession();
  const { latitude, longitude, radius } = getCoordinates();

  return api.post("item/v8/", {
    json: {
      favorites_only: true,
      origin: {
        latitude: latitude,
        longitude: longitude,
      },
      radius: radius,
      user_id: session.userId
    },
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}

function getSession() {
  return config.get("api.session") || {};
}

function getCoordinates() {
  const coordinates = config.get("api.coordinates");

  if (coordinates == null) return {};

  const { latitude, longitude, radius } = coordinates;

  const randomLatitude = latitude + Math.random() / 1000;
  const randomLongitude = longitude + Math.random() / 1000;
  const randomRadius = radius + Math.random() * 100;

  return {
    latitude: randomLatitude,
    longitude: randomLongitude,
    radius: randomRadius,
  };
}

function createSession(login) {
  if (login) {
    config.set("api.session", {
      userId: login.startup_data.user.user_id,
      accessToken: login.access_token,
      refreshToken: login.refresh_token,
    });
  }
  return login;
}

function updateSession(token) {
  config.set("api.session.accessToken", token.access_token);
  return token;
}
