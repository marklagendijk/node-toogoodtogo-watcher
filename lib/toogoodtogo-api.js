import _ from "lodash";
import { v4 as uuidv4 } from "uuid";
import got from "got";
import { CookieJar } from "tough-cookie";
import { config } from "./config.js";

const api = got.extend({
  cookieJar: new CookieJar(),
  prefixUrl: "https://apptoogoodtogo.com/api/",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
    "Accept-Language": "en-US",
    "Accept-Encoding": "gzip",
  },
  hooks: {
    beforeRequest: [
      (options) => {
        options.headers["x-correlation-id"] = config.get("api.correlationId");
      },
    ],
  },
  responseType: "json",
  resolveBodyOnly: true,
  retry: {
    limit: 2,
    methods: ["GET", "POST", "PUT", "HEAD", "DELETE", "OPTIONS", "TRACE"],
    statusCodes: [401, 403, 408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
  },
});

export function authByEmail() {
  config.set("api.correlationId", uuidv4());

  return api.post("auth/v5/authByEmail", {
    headers: getHeaders(),
    json: {
      device_type: config.get("api.deviceType", "ANDROID"),
      email: config.get("api.credentials.email"),
    },
  });
}

export function authPoll(polling_id) {
  return api
    .post("auth/v5/authByRequestPollingId", {
      headers: getHeaders(),
      json: {
        device_type: config.get("api.deviceType", "ANDROID"),
        email: config.get("api.credentials.email"),
        request_polling_id: polling_id,
      },
    })
    .then(createSession);
}

export function login() {
  config.set("api.correlationId", uuidv4());

  const session = getSession();
  if (session.refreshToken) {
    return refreshToken();
  }
  throw "You are not logged in. Login via the command `toogoodtogo-watcher login` or `/login` with the Telegram Bot";
}

function refreshToken() {
  const session = getSession();

  return api
    .post("token/v1/refresh", {
      headers: getHeaders(),
      json: {
        refresh_token: session.refreshToken,
      },
    })
    .then(updateSession);
}

function getHeaders(headers = {}) {
  return _.defaults(headers, config.get("api.headers"), {
    "User-Agent": `TGTG/${config.get("api.appVersion")} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)`,
  });
}

export function listFavoriteBusinesses() {
  const session = getSession();

  return api.post("item/v8/", {
    headers: getHeaders({
      Authorization: `Bearer ${session.accessToken}`,
    }),
    json: {
      favorites_only: true,
      origin: {
        latitude: 52.5170365,
        longitude: 13.3888599,
      },
      radius: 200,
    },
  });
}

function getSession() {
  return config.get("api.session") || {};
}

function createSession(login) {
  if (login) {
    config.set("api.session", {
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

export async function updateAppVersion() {
  try {
    const googlePlayResponse = await got.get(
      "https://play.google.com/store/apps/details?id=com.app.tgtg",
      {
        resolveBodyOnly: true,
      },
    );
    const candidateVersions = [];
    const matchesInitDataCallback = googlePlayResponse.matchAll(
      /<script class="\S+" nonce="\S+">AF_initDataCallback\((.*?)\);/g,
    );
    for (const match of matchesInitDataCallback) {
      const matchesVersion = match[1].matchAll(/(\d+\.\d+\.\d+)/g);
      for (const match of matchesVersion) {
        candidateVersions.push(match[1]);
      }
    }
    const version = candidateVersions.reduce((a, b) =>
      0 < a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
        ? a
        : b,
    );
    config.set("api.appVersion", version);
  } catch (error) {
    console.log(
      `Error while retrieving latest version of TGTG on Google Play page: \n${error}`,
    );
  }
}
