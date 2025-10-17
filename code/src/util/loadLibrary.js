import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'apisauce';
import _ from 'lodash';
import React from 'react';

// custom components and helper files
import { popToast } from '../components/loadError';
import { getTermFromDictionary } from '../translations/TranslationService';
import { createAuthTokens, getErrorMessage, getHeaders, postData } from './apiAuth';
import { GLOBALS } from './globals';
import { PATRON } from './loadPatron';
import { RemoveData } from './logout';

import { logDebugMessage, logInfoMessage, logWarnMessage, logErrorMessage } from '../util/logging.js';

export const LIBRARY = {
     url: '',
     name: '',
     favicon: '',
     languages: [],
     vdx: [],
     localIll: [],
};

export const BRANCH = {
     name: '',
     vdxFormId: null,
     vdxLocation: null,
     vdx: [],
     localIllFormId: null,
};

export const ALL_LOCATIONS = {
     branches: [],
};

export const ALL_BRANCHES = {};

/**
 * Fetch settings for app that are maintained by the library
 **/
export async function getAppSettings(url, timeout, slug) {
     logDebugMessage("Getting App Settings from url: " + url + " slug: " + slug);
     try {
          const api = create({
               baseURL: url + '/API',
               timeout,
               headers: getHeaders(),
               auth: createAuthTokens(),
          });
          const response = await api.get('/SystemAPI?method=getAppSettings', {
               slug
          });
          if (response !== undefined && response.ok) {
               LIBRARY.appSettings = response.data?.result?.settings ?? [];
               return response.data?.result?.settings ?? [];
          } else {
               logWarnMessage("Did not get valid response from getAppSettings url: " + url + " slug: " + slug);
               if (response === undefined) {
                    logWarnMessage("Response was undefined :(");
               }else{
                    logWarnMessage(response);
               }
               const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
               popToast(error.title, error.message, 'error');
               return [];
          }
     }catch (err) {
          popToast(getTermFromDictionary('en', 'error_no_server_connection'), "Could not retrieve App Settings, please try again later.", 'error');
          logErrorMessage("Exception in getAppSettings " + err);
          return [];
     }
}

/**
 * Fetch valid pickup locations for the patron
 **/
export async function getPickupLocations(url = null, groupedWorkId = null, recordId = null) {
     let baseUrl = url ?? LIBRARY.url;
     const postBody = await postData();
     const api = create({
          baseURL: baseUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: {
               groupedWorkId,
               recordId,
          }
     });
     const response = await api.post('/UserAPI?method=getValidPickupLocations', postBody);

     if (response.ok) {
          let locations = [];
          const result = response.data.result;
          //update pickup locations to the format we need for select lists
          const data = response.data.result.pickupLocations;
          if (_.isObject(data) || _.isArray(data)) {
               locations = data.map(({ displayName, code, locationId }) => ({
                    key: locationId,
                    locationId,
                    code,
                    name: displayName,
               }));
          }

          try {
               await AsyncStorage.setItem('@pickupLocations', JSON.stringify(locations));
          } catch (e) {
               logDebugMessage(e);
          }

          PATRON.pickupLocations = locations;
          result.locations = locations;
          return result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function getPickupSublocations(url = null) {
     let sublocations = [];
     let baseUrl = url ?? LIBRARY.url;
     const postBody = await postData();
     const api = create({
          baseURL: baseUrl + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens()
     });
     const response = await api.post('/UserAPI?method=getValidSublocations', postBody);

     if (response.ok) {
          if (response.data.result.success) {
               const data = response.data.result.sublocations;

               if (_.isObject(data) || _.isArray(data)) {
                    sublocations = data;
               }else{
                    sublocations = [];
               }

               PATRON.sublocations = sublocations;
               return sublocations;
          }else{
               logErrorMessage("Call to get sublocations did not succeed");
               logErrorMessage(response);
          }
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }

     PATRON.sublocations = sublocations;
     return sublocations;
}

export async function getVdxForm(url, id) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: { formId: id },
     });
     const response = await api.post('/SystemAPI?method=getVdxForm', postBody);
     if (response.ok) {
          LIBRARY.vdx = response.data.result;
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export async function getLocalIllForm(url, id) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutAverage,
          headers: getHeaders(true),
          auth: createAuthTokens(),
          params: { formId: id },
     });
     const response = await api.post('/SystemAPI?method=getLocalIllForm', postBody);
     if (response.ok) {
          LIBRARY.localIll = response.data.result;
          return response.data.result;
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
}

export function formatDiscoveryVersion(payload) {
     try {
          const result = payload.split(' ');
          if (_.isObject(result)) {
               LIBRARY.version = result[0];
               return result[0];
          }
     } catch (e) {
          logErrorMessage(e)
     }
     return payload;
}

export function formatBrowseCategories(payload) {
     const categories = [];
     if (!_.isUndefined(payload)) {
          payload.map(function (category, index, array) {
               const subCategories = category['subCategories'] ?? [];
               const manyLists = category['lists'] ?? [];
               const records = category['records'] ?? [];
               const allEvents = category['events'] ?? [];
               const lists = [];
               const events = [];
               if (!_.isEmpty(subCategories) && subCategories.length > 0) {
                    subCategories.forEach((item) =>
                         categories.push({
                              key: item.key,
                              title: item.title,
                              source: item.source,
                              records: item.records,
                              isHidden: item.isHidden ?? false,
                         })
                    );
               } else {
                    if (!_.isEmpty(subCategories) || !_.isEmpty(manyLists) || !_.isEmpty(records) || !_.isEmpty(allEvents)) {
                         if (!_.isEmpty(subCategories) && subCategories.length > 0) {
                              subCategories.forEach((item) =>
                                   categories.push({
                                        key: item.key,
                                        title: item.title,
                                        source: item.source,
                                        records: item.records,
                                        isHidden: item.isHidden ?? false,
                                   })
                              );
                         } else {
                              if (!_.isEmpty(manyLists)) {
                                   manyLists.forEach((item) =>
                                        lists.push({
                                             id: item.sourceId,
                                             categoryId: category.key,
                                             source: 'List',
                                             title_display: item.title,
                                             isHidden: category.isHidden ?? false,
                                        })
                                   );
                              }

                              if (!_.isEmpty(allEvents)) {
                                   allEvents.forEach((item) =>
                                        events.push({
                                             id: item.sourceId ?? item.id,
                                             categoryId: category.key,
                                             source: 'Event',
                                             title_display: item.title ?? item.title_display,
                                             isHidden: category.isHidden ?? false,
                                        })
                                   );
                              }

                              let id = category.key;
                              const categoryId = category.key;
                              if (lists.length !== 0) {
                                   if (!_.isUndefined(category.listId)) {
                                        id = category.listId;
                                   }

                                   let numNewTitles = 0;
                                   if (!_.isUndefined(category.numNewTitles)) {
                                        numNewTitles = category.numNewTitles;
                                   }
                                   categories.push({
                                        key: id,
                                        title: category.title,
                                        source: category.source,
                                        numNewTitles,
                                        records: lists,
                                        id: categoryId,
                                        isHidden: category.isHidden ?? false,
                                   });
                              }

                              if (events.length !== 0) {
                                   if (!_.isUndefined(category.listId)) {
                                        id = category.listId;
                                   }

                                   let numNewTitles = 0;
                                   if (!_.isUndefined(category.numNewTitles)) {
                                        numNewTitles = category.numNewTitles;
                                   }

                                   categories.push({
                                        key: id,
                                        title: category.title,
                                        source: category.source,
                                        numNewTitles: numNewTitles,
                                        records: events,
                                        isHidden: category.isHidden ?? false,
                                        id: categoryId,
                                   });
                              }

                              if (records.length !== 0) {
                                   if (!_.isUndefined(category.listId) && !_.isNull(category.listId)) {
                                        id = category.listId;
                                   }

                                   if (!_.isUndefined(category.sourceId) && !_.isNull(category.sourceId) && category.sourceId !== '' && category.sourceId !== -1 && category.sourceId !== '-1') {
                                        id = category.sourceId;
                                   }

                                   let numNewTitles = 0;
                                   if (!_.isUndefined(category.numNewTitles)) {
                                        numNewTitles = category.numNewTitles;
                                   }

                                   if (_.find(categories, ['id', categoryId])) {
                                        let thisCategory = _.find(categories, ['id', categoryId]);
                                        let allRecords = category.records;
                                        let allFormattedRecords = [];
                                        allRecords.forEach((item) =>
                                             allFormattedRecords.push({
                                                  id: item.id,
                                                  categoryId: category.key,
                                                  source: 'grouped_work',
                                                  title_display: item.title,
                                             })
                                        );
                                        thisCategory.records = _.concat(thisCategory.records, allFormattedRecords);
                                        _.merge(categories, thisCategory);
                                   } else {
                                        categories.push({
                                             key: id,
                                             title: category.title,
                                             source: category.source,
                                             numNewTitles,
                                             records: category.records,
                                             isHidden: category.isHidden ?? false,
                                             id: categoryId,
                                        });
                                   }
                              }
                         }
                    }
               }
          });
     }
     return categories;
}

export async function reloadBrowseCategories(maxCat, url = null) {
     let maxCategories = maxCat ?? 5;
     const postBody = await postData();
     let discovery;
     let baseUrl = url ?? LIBRARY.url;
     if (maxCategories !== 9999) {
          discovery = create({
               baseURL: baseUrl + '/API',
               timeout: GLOBALS.timeoutAverage,
               headers: getHeaders(true),
               auth: createAuthTokens(),
               params: {
                    maxCategories: maxCategories,
                    LiDARequest: true,
               },
          });
     } else {
          discovery = create({
               baseURL: baseUrl + '/API',
               timeout: GLOBALS.timeoutAverage,
               headers: getHeaders(true),
               auth: createAuthTokens(),
               params: {
                    LiDARequest: true,
               },
          });
     }
     const response = await discovery.post('/SearchAPI?method=getAppActiveBrowseCategories&includeSubCategories=true', postBody);

     if (response.ok) {
          if (response.data.result) {
               return formatBrowseCategories(response.data.result);
          }
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          popToast(error.title, error.message, 'error');
          logErrorMessage(response);
     }
     return [];
}
