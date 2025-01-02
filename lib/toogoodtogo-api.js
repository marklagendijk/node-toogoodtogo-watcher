import _ from "lodash";
import got from "got";
import { CookieJar } from "tough-cookie";
import { config } from "./config.js";

let tgtgVersion = "24.12.0";

await refreshLatestTgtgVersion();

const api = got.extend({
  cookieJar: new CookieJar(),
  prefixUrl: "https://apptoogoodtogo.com/api/",
  headers: _.defaults(config.get("api.headers"), {
    "User-Agent":
      `TGTG/${tgtgVersion} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)`,
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

  return api.post("auth/v4/authByEmail", {
    json: {
      device_type: config.get("api.deviceType", "ANDROID"),
      email: credentials.email,
    },
  });
}

export function authPoll(polling_id) {
  const credentials = config.get("api.credentials");

  return api
    .post("auth/v4/authByRequestPollingId", {
      json: {
        device_type: config.get("api.deviceType", "ANDROID"),
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
    .post("auth/v4/token/refresh", {
      json: {
        refresh_token: session.refreshToken,
      },
    })
    .then(updateSession);
}

export function listFavoriteBusinesses() {
  const session = getSession();

  return api.post("item/v8/", {
    json: {
      favorites_only: true,
      origin: {
        latitude: 52.5170365,
        longitude: 13.3888599,
      },
      radius: 200,
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

async function refreshLatestTgtgVersion() {
  try {
    const gplayResponse = await got.get("https://play.google.com/store/apps/details?id=com.app.tgtg", {
      resolveBodyOnly: true
    })
    const candidateVersions = [];
    const matchesInitDataCallback = gplayResponse.matchAll(
      /<script class=\"\S+\" nonce=\"\S+\">AF_initDataCallback\((.*?)\);/g,
    );
    for (const match of matchesInitDataCallback) {
      const matchesVersion = match[1].matchAll(/(\d+\.\d+\.\d+)/g);
      for (const match of matchesVersion) {
        candidateVersions.push(match[1])
      }
    }
    tgtgVersion = candidateVersions.reduce((a, b) =>
      0 < a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        ? a
        : b
    )
  } catch (error) {
    console.log(
      `Error while retrieving latest version of TGTG on Google Play page: \n${error}`
    )
  }
}
