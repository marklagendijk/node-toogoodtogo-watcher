import { config } from "../config.js";

// Cache for datadome cookie
let datadomeCache = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Generate a CID (client ID) - base64-like string
function generateCID() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~_";
  let result = "";
  for (let i = 0; i < 120; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if the cached cookie is still valid
 */
function isCacheValid() {
  if (!datadomeCache?.expiresAt) {
    return false;
  }
  const now = Date.now();
  return now < datadomeCache.expiresAt;
}

/**
 * Retrieve datadome cookie from DataDome SDK
 */
async function fetchDataDomeCookie(requestUrl, userAgent, cid) {
  const params = new URLSearchParams({
    camera:
      '{"auth":"true", "info":"{\\"front\\":\\"2000x1500\\",\\"back\\":\\"5472x3648\\"}"}',
    cid,
    ddk: "1D42C2CA6131C526E09F294FE96F94",
    ddv: "3.0.4",
    ddvc: config.get("api.appVersion"),
    events:
      '[{"id":1,"message":"response validation","source":"sdk","date":' +
      Date.now() +
      "}]",
    inte: "android-java-okhttp",
    mdl: "Pixel 7 Pro",
    os: "Android",
    osn: "UPSIDE_DOWN_CAKE",
    osr: "14",
    osv: "34",
    request: requestUrl,
    screen_d: "3.5",
    screen_x: "1440",
    screen_y: "3120",
    ua: userAgent,
  });

  const DATADOME_SDK_URL = "https://api-sdk.datadome.co/sdk/";

  try {
    const response = await fetch(DATADOME_SDK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "*/*",
        "User-Agent": userAgent,
        "Accept-Encoding": "gzip, deflate, br",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.status === 200 && data.cookie) {
      // Extract just the cookie value
      const cookieMatch = data.cookie.match(/datadome=([^;]+)/);
      if (cookieMatch) {
        const cookieValue = cookieMatch[1];
        return `datadome=${cookieValue}`;
      }
    }

    return null;
  } catch (error) {
    console.error("[DataDome Hook] ❌ Error fetching cookie:", error.message);
    return null;
  }
}

function containsDatadomeCookie(headers) {
  return headers?.cookie?.includes("datadome=");
}

/**
 * Got beforeRequest hook to inject datadome cookie if not present
 */
export const datadomeHook = async (options) => {
  if (options?.headers?.removeDatadomeCookie) {
    delete options.headers.cookie;
    delete options.headers.removeDatadomeCookie;
  }

  const hasDatadomeCookie = containsDatadomeCookie(options.headers);
  if (hasDatadomeCookie) {
    // Cookie already present, no need to fetch
    return;
  }

  // Check if we have a valid cached cookie
  if (isCacheValid()) {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.cookie = datadomeCache.cookie;
    return;
  }

  // Fetch new datadome cookie

  const userAgent =
    options.headers?.["User-Agent"] ||
    `TGTG/${config.get("api.appVersion")} Dalvik/2.1.0 (Linux; Android 12; SM-G920V Build/MMB29K)`;

  const requestUrl = new URL(
    options.url || options.href,
    options.prefixUrl || "https://apptoogoodtogo.com/api/",
  ).toString();

  const cid = generateCID();
  const cookie = await fetchDataDomeCookie(requestUrl, userAgent, cid);

  if (cookie) {
    // Update cache
    datadomeCache = {
      cookie,
      cid,
      expiresAt: Date.now() + CACHE_DURATION_MS,
    };

    // Set cookie in request headers
    if (!options.headers) {
      options.headers = {};
    }
    options.headers.cookie = cookie;
  }
};

export const datadomeHookRetry = (error, retryCount) => {
  if (error.response?.statusCode !== 403) {
    return;
  }

  const hasDatadomeCookie = containsDatadomeCookie(
    error?.request.options?.headers,
  );

  if (!hasDatadomeCookie) {
    return;
  }

  error.request.options.headers.removeDatadomeCookie = true;

  // Invalidate cache on multiple retries
  if (retryCount > 1) {
    datadomeCache = null;
  }
};
