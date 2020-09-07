const _ = require("lodash");
const { from, of, combineLatest, timer } = require("rxjs");
const { mergeMap, filter, map, retry, catchError } = require("rxjs/operators");
const { config } = require("./config");
const api = require("./api");

module.exports = {
  pollFavoriteBusinesses$,
};

function pollFavoriteBusinesses$(enabled$) {
  const authenticationByInterval$ = authenticateByInterval$();
  let currentHour = new Date().getUTCHours();
  let inSchedule = false;
  let hoursDiff = 24;
  let closestHour = -1;
  let schedule = config.get("misc.scheduleUTC");
  for (x of schedule) {
    let y = x.split("-");
    if (currentHour >= y[0] && currentHour < y[1]) {
      inSchedule = true;
      break;
    } else {
      if (closestHour === -1) {
        closestHour = y[0];
      } else {
        let diff = 24 - currentHour + y[0];
        if (diff < 0) {
          diff = -diff;
        }
        if (diff < hoursDiff) {
          closestHour = y[0];
        }
      }
    }
  }

  if (!inSchedule) {
    let sleepTime = calcSleepTime(closestHour, currentHour);
    console.log(
      "[Scheduler] Going to sleep for " + sleepTime + " milliseconds! zzz.."
    );
    msleep(sleepTime + 1000);
  }
  return listFavoriteBusinessesByInterval$(authenticationByInterval$, enabled$);
}

//sleep for n milliseconds
function msleep(n) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function calcSleepTime(closestHour, currentHour) {
  closestHour = parseInt(closestHour);
  let res2 = Date.now();
  let resumeTimeObj = Date.now();
  if (closestHour < currentHour) {
    resumeTimeObj += (24 - currentHour + closestHour) * 3600 * 1000;
  }
  let resumeTime = new Date(resumeTimeObj);
  resumeTime.setHours(closestHour);
  resumeTime.setMinutes(0);
  resumeTime.setSeconds(0);
  resumeTimeObj = resumeTime.setMilliseconds(0);
  return resumeTimeObj - res2;
}

function authenticateByInterval$() {
  const authenticationIntervalInMs = getInterval(
    "api.authenticationIntervalInMs",
    false
  );

  return timer(0, authenticationIntervalInMs).pipe(
    mergeMap(() =>
      from(api.login()).pipe(
        retry(2),
        catchError(logError),
        filter((authentication) => !!authentication)
      )
    )
  );
}

function listFavoriteBusinessesByInterval$(
  authenticationByInterval$,
  enabled$
) {
  const pollingIntervalInMs = getInterval("api.pollingIntervalInMs", true);
  console.log("Retrieving businesses ...");

  return combineLatest(
    enabled$,
    timer(0, pollingIntervalInMs),
    authenticationByInterval$
  ).pipe(
    filter(([enabled]) => enabled),
    mergeMap(() =>
      from(api.listFavoriteBusinesses()).pipe(
        retry(2),
        catchError(logError),
        filter((response) => !!_.get(response, "items")),
        map((response) => response.items)
      )
    )
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

function getInterval(key, randomize) {
  let value = config.get(key);
  if (randomize) {
    return Math.floor(Math.random() * (value.max - value.min) + value.min);
  } else {
    return value.min;
  }
}
