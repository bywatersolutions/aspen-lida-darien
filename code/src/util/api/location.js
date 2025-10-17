import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';
import { createAuthTokens, getErrorMessage, getHeaders } from '../apiAuth';
import { GLOBALS } from '../globals';
import { LIBRARY } from '../loadLibrary';
import { popToast } from '../../components/loadError';
import { logDebugMessage, logErrorMessage } from '../logging';

export async function getLocationInfo(url = null, locationId = null) {
     const apiUrl = url ?? LIBRARY.url;

     if (!locationId) {
          try {
               locationId = await AsyncStorage.getItem('@locationId');
          } catch (e) {
               logDebugMessage(e);
          }
     }

     const discovery = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               id: locationId,
               version: GLOBALS.appVersion,
          },
     });
     const response = await discovery.get('/SystemAPI?method=getLocationInfo');
     if (response.ok) {
          if (response.data.result) {
               return response.data.result.location;
          }
     } else {
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          return [];
     }
}

export async function getSelfCheckSettings(url = null) {
     const apiUrl = url ?? LIBRARY.url;
     let locationId;
     try {
          locationId = await AsyncStorage.getItem('@locationId');
     } catch (e) {
          logDebugMessage(e);
     }

     const discovery = create({
          baseURL: apiUrl + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               locationId: locationId,
          },
     });
     const response = await discovery.get('/SystemAPI?method=getSelfCheckSettings');
     if (response.ok) {
          if (response.data.result) {
               return response.data.result;
          } else {
               return {
                    success: false,
                    settings: [],
               };
          }
     } else {
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
     }
     return {
          success: false,
          settings: [],
     };
}

export async function getLocations(url, language = 'en', latitude, longitude) {
     const discovery = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutFast,
          headers: getHeaders(),
          auth: createAuthTokens(),
          params: {
               latitude,
               longitude,
               language,
          },
     });
     const response = await discovery.get('/SystemAPI?method=getLocations');
     if (response.ok) {
          if (response?.data?.result?.locations) {
               return response.data.result.locations;
          }
     } else {
          getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
     }
     return [];
}