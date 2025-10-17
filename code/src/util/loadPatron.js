import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';
import _ from 'lodash';

// custom components and helper files
import { createAuthTokens, getErrorMessage, getHeaders, postData } from './apiAuth';
import { GLOBALS } from './globals';
import { LIBRARY } from './loadLibrary';
import { popToast } from '../components/loadError';
import { logErrorMessage } from './logging';

export const PATRON = {
     userToken: null,
     scope: null,
     library: null,
     location: null,
     listLastUsed: null,
     fines: 0,
     messages: [],
     num: {
          checkedOut: 0,
          holds: 0,
          lists: 0,
          overdue: 0,
          ready: 0,
          savedSearches: 0,
          updatedSearches: 0,
     },
     promptForOverdriveEmail: 1,
     rememberHoldPickupLocation: 0,
     pickupLocations: [],
     language: 'en',
     coords: {
          lat: null,
          long: null,
     },
     linkedAccounts: [],
     holds: [],
     lists: [],
     browseCategories: [],
     sublocations: [],
};

export async function getILSMessages(url) {
     let baseUrl = url ?? LIBRARY.url;
     const postBody = await postData();
     const api = create({
          baseURL: baseUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     const response = await api.post('/UserAPI?method=getILSMessages', postBody);
     if (response.ok) {
          let messages = [];
          if (response.data.result.messages) {
               messages = response.data.result.messages;
               PATRON.messages = messages;
               try {
                    await AsyncStorage.setItem('@ILSMessages', JSON.stringify(messages));
               } catch (e) {
                    console.log(e);
               }
          } else {
               try {
                    await AsyncStorage.setItem('@ILSMessages', JSON.stringify(messages));
               } catch (e) {
                    console.log(e);
               }
          }
          return messages;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function reloadHolds(url) {
     let response;
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutSlow,
          headers: getHeaders(true),
          params: {
               source: 'all',
               linkedUsers: true,
               refreshHolds: true,
          },
          auth: createAuthTokens(),
     });
     response = await api.post('/UserAPI?method=getPatronHolds', postBody);
     if (response.ok) {
          const allHolds = response.data.result.holds;
          let holds;
          let holdsReady = [];
          let holdsNotReady = [];

          if (typeof allHolds !== 'undefined') {
               if (typeof allHolds.unavailable !== 'undefined') {
                    holdsNotReady = Object.values(allHolds.unavailable);
               }

               if (typeof allHolds.available !== 'undefined') {
                    holdsReady = Object.values(allHolds.available);
               }
          }

          holds = holdsReady.concat(holdsNotReady);
          PATRON.holds = holds;

          return [
               {
                    title: 'Ready',
                    data: holdsReady,
               },
               {
                    title: 'Pending',
                    data: holdsNotReady,
               }
          ]
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return {
               holds: [],
               holdsReady: [],
               holdsNotReady: [],
          };
     }
}

export async function getBrowseCategoryListForUser(url = null) {
     const postBody = await postData();
     let baseUrl = url ?? LIBRARY.url;
     const discovery = create({
          baseURL: baseUrl,
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               checkIfValid: false,
          },
     });
     const response = await discovery.post('/API/SearchAPI?method=getBrowseCategoryListForUser', postBody);

     if (response.ok) {
          return _.sortBy(response.data.result, ['title']);
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return false;
     }
}

export async function updateBrowseCategoryStatus(id, url = null) {
     const postBody = await postData();
     let baseUrl = url ?? LIBRARY.url;
     const discovery = create({
          baseURL: baseUrl,
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          params: { browseCategoryId: id },
          auth: createAuthTokens(),
     });
     const response = await discovery.post('/API/UserAPI?method=updateBrowseCategoryStatus', postBody);
     if (response.ok) {
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return false;
     }
}
