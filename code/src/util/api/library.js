import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';
import _ from 'lodash';
import { createAuthTokens, getErrorMessage, getHeaders, postData, stripHTML } from '../apiAuth';
import { GLOBALS } from '../globals';
import { LIBRARY } from '../loadLibrary';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../logging.js';
import { popToast } from '../../components/loadError';

export async function getLibraryInfo(url = null, id = null) {
     const apiUrl = url ?? LIBRARY.url;
     let libraryId;

     try {
          libraryId = await AsyncStorage.getItem('@libraryId');
     } catch (e) {
          logErrorMessage("Error loading library info");
          logErrorMessage(e);
     }

     if (id) {
          libraryId = id;
     }
	 if (typeof(libraryId) == "string")
	 {
		//strip quotes from libraryId
		libraryId = libraryId.replace(/['"]+/g, '');
		//then convert it into an int
		libraryId = parseInt(libraryId);
	 }

     const discovery = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               id: libraryId,
          },
     });
     const response = await discovery.get('/SystemAPI?method=getLibraryInfo');
     if (response.ok) {
          if (response.data.result) {
               return response.data.result.library;
          }
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return [];
     }
}

/**
 * Return list of library menu links
 **/
export async function getLibraryLinks(url = null) {
     const postBody = await postData();
     const apiUrl = url ?? LIBRARY.url;
     const discovery = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     const response = await discovery.post('/SystemAPI?method=getLibraryLinks', postBody);
     if (response.ok) {
          if (response?.data?.result?.items) {
               return response?.data?.result?.items;
          }
     } else {
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

/**
 * Return list of available languages
 **/
export async function getLibraryLanguages(url = null) {
     const apiUrl = url ?? LIBRARY.url;
     const api = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
     });
     const response = await api.get('/SystemAPI?method=getLanguages');
     if (response.ok) {
          let languages = [];
          if (response?.data?.result) {
               logDebugMessage('Library languages saved at Loading');
               return _.sortBy(response.data.result.languages, 'weight', 'displayName');
          }
          return languages;
     } else {
          logErrorMessage("Error loading library languages");
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

/**
 * Return array of pre-validated system messages
 * @param {int|null} libraryId
 * @param {int|null} locationId
 * @param {string} url
 **/
export async function getSystemMessages(libraryId = null, locationId = null, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               libraryId,
               locationId,
          },
     });
     const response = await api.post('/SystemAPI?method=getSystemMessages', postBody);
     if (response.ok) {
          let messages = [];
          if (response?.data?.result) {
               /*
			 0 => 'All Pages',
			 1 => 'All Account Pages',
			 2 => 'Checkouts Page',
			 3 => 'Holds Page',
			 4 => 'Fines Page',
			 5 => 'Contact Information Page'
			 */
               logDebugMessage('System messages fetched and stored');
               return _.castArray(response.data.result.systemMessages);
          }
          return messages;
     } else {
          logErrorMessage("Error loading system messages");
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

/**
 * Dismiss given system message from displaying again
 * @param {int} systemMessageId
 * @param {string} url
 **/
export async function dismissSystemMessage(systemMessageId, url) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               systemMessageId,
          },
     });
     const response = await api.post('/SystemAPI?method=dismissSystemMessage', postBody);
     if (response.ok) {
          if (response?.data?.result) {
               return response.data.result;
          }
     } else {
          logErrorMessage("Error dismissing system message");
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

/**
 * Check if Aspen Discovery is in offline mode
 * @param {string} url
 **/
export async function getCatalogStatus(url = null) {
     const apiUrl = url ?? LIBRARY.url;
     const api = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(),
          auth: createAuthTokens(),
     });
     const response = await api.get('/SystemAPI?method=getCatalogStatus');
     if (response.ok) {
          if (response?.data?.result) {
               let catalogMessage = null;
               if (response?.data?.result?.api?.message) {
                    catalogMessage = stripHTML(response?.data?.result?.api.message);
               }
               return {
                    status: response?.data?.result?.catalogStatus ?? 0,
                    message: catalogMessage,
               };
          }
     } else {
          logErrorMessage("Error getting catalog status");
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
     return {
          status: 0,
          message: null,
     };
}

/**
 * Returns basic registration form fields
 * @param {string} url
 **/
export async function getSelfRegistrationForm(url = '') {
     const apiUrl = url ?? LIBRARY.url;
     const api = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(),
          auth: createAuthTokens(),
     });
     const response = await api.get('/RegistrationAPI?method=getSelfRegistrationForm');
     if (response.ok) {
          if (response?.data?.result) {
               let fields = [];
               if (response?.data?.result) {
                    fields = response.data.result;
               }
               return fields;
          }
     } else {
          logErrorMessage("Error getting self registration form");
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

export async function submitSelfRegistration(url = '', data = []) {
     const apiUrl = url ?? LIBRARY.url;
     const api = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: data,
     });
     const response = await api.post('/RegistrationAPI?method=processSelfRegistration');
     if (response.ok) {
          if (response?.data?.result) {
               return response.data.result;
          }
          return response.data;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
          return {
               success: false,
               message: error.message ?? 'There was an error processing your registration. Please contact your library.',
          }
     }
}
