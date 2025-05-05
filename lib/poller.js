import _ from "lodash";
import { combineLatest, from, of, timer } from "rxjs";
import { catchError, filter, map, mergeMap, retry } from "rxjs/operators";
import { config } from "./config.js";
import { login, listFavoriteBusinesses } from "./toogoodtogo-api.js";

const MINIMAL_POLLING_INTERVAL = 15000;
const MINIMAL_AUTHENTICATION_INTERVAL = 3600000;

export function pollFavoriteBusinesses$(enabled$) {
  const authenticationByInterval$ = authenticateByInterval$();
  return listFavoriteBusinessesByInterval$(authenticationByInterval$, enabled$);
}

function authenticateByInterval$() {
  const authenticationIntervalInMs = getInterval(
    "api.authenticationIntervalInMS",
    MINIMAL_AUTHENTICATION_INTERVAL,
  );

  return timer(0, authenticationIntervalInMs).pipe(
    mergeMap(() =>
      from(login()).pipe(
        retry(2),
        catchError(logError),
        filter((authentication) => !!authentication),
      ),
    ),
  );
}

function listFavoriteBusinessesByInterval$(
  authenticationByInterval$,
  enabled$,
) {
  const pollingIntervalInMs = getInterval(
    "api.pollingIntervalInMs",
    MINIMAL_POLLING_INTERVAL,
  );

  return combineLatest([
    enabled$,
    timer(0, pollingIntervalInMs),
    authenticationByInterval$,
  ]).pipe(
    filter(([enabled]) => enabled),
    mergeMap(() =>
      from(listFavoriteBusinesses()).pipe(
        retry(2),
        catchError(logError),
        filter((response) => !!_.get(response, "items")),
        map((response) => response.items),
      ),
    ),
  );
}

function logError(error) {
  if (error.options) {
    console.error(`Error during request:
${error.options.method} ${error.options.url.toString()}
${JSON.stringify(error.options.json, null, 4)}

${error.stack}`);
  } else if (error.stack) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
  return of(null);
}

function getInterval(configPath, minimumIntervalInMs) {
  const configuredIntervalInMs = config.get(configPath);
  return _.isFinite(configuredIntervalInMs)
    ? Math.max(configuredIntervalInMs, minimumIntervalInMs)
    : minimumIntervalInMs;
}
