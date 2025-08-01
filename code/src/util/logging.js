import { GLOBALS } from './globals';

/**
 * Does logging of messages to console.log depending on the value of logLevel within the app config.
 * values are:
 * 0 -> No logging
 * 1 -> Debug and higher
 * 2 -> Info and higher
 * 3 -> Warning and higher
 * 4 -> Error and higher
 */
export function logDebugMessage(message) {
     if (__DEV__) {
          if (GLOBALS.logLevel == 1) {
               logMessage("DEBUG", message);
          }
     }
}

export function logInfoMessage(message) {
     if (__DEV__) {
          if (GLOBALS.logLevel == 1 || GLOBALS.logLevel == 2) {
               logMessage("INFO", message);
          }
     }
}

export function logWarnMessage(message) {
     if (__DEV__) {
          if (GLOBALS.logLevel >= 1 && GLOBALS.logLevel <=3) {
               logMessage("WARN", message);
          }
     }else{
          //TODO: log warning to Sentry?
     }
}

export function logErrorMessage(message) {
     if (__DEV__) {
          if (GLOBALS.logLevel >= 1 && GLOBALS.logLevel <=4) {
               logMessage('ERROR', message);
          }
     }else{
          //TODO: log error to Sentry?
     }
}

function logMessage(type, message) {
     if (typeof message === "object") {
          console.log(type + " --> " + JSON.stringify(message));
     }else if (message === null) {
          console.log(type + " " + null);
     }else{
          console.log(type + " " + message);
     }
}
