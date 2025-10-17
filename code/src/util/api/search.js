import _ from 'lodash';
import { createAuthTokens, getErrorMessage, getHeaders, postData } from '../apiAuth';
import { GLOBALS } from '../globals';
import { create } from 'apisauce';
import { popToast } from '../../components/loadError';
import { logErrorMessage } from '../logging';

export async function fetchSearchResultsForBrowseCategory(category, page, limit = 25, url, language) {
     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutSlow,
          headers: getHeaders(true),
          params: {
               limit,
               id: category,
               page,
               language,
          },
          auth: createAuthTokens(),
     });

     let message = null;
     let data = [];
     let items = [];

     const response = await api.post('/SearchAPI?method=getAppBrowseCategoryResults', postBody);

     if (response.ok) {
          data = response.data.result;

          if (category === 'system_recommended_for_you') {
               items = data.records;
          } else {
               items = data.items;
          }

          if(data.message) {
               message = data.message;
          }
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          message = error.message;
     }

     let morePages = true;
     if (data?.page_current === data?.page_total) {
          morePages = false;
     } else if (data?.page_total === 1) {
          morePages = false;
     }

     return {
          results: items,
          totalRecords: data.totalResults ?? 0,
          curPage: data.page_current ?? 0,
          totalPages: data.page_total ?? 0,
          hasMore: morePages,
          message: message,
          error: false,
     };
}

export async function fetchSearchResultsForSavedSearch(id, page, limit = 25, url, language) {
     let searchId = id;
     if (_.isString(searchId)) {
          if (searchId.includes('system_saved_search')) {
               const myArray = searchId.split('_');
               searchId = myArray[3];
          }
     }

     const postBody = await postData();
     const api = create({
          baseURL: url + '/API',
          timeout: GLOBALS.timeoutSlow,
          headers: getHeaders(true),
          params: {
               limit,
               id: searchId,
               page,
               language,
          },
          auth: createAuthTokens(),
     });

     let data = [];
     let message = null;

     const response = await api.post('/SearchAPI?method=getSavedSearchResults', postBody);

     if (response.ok) {
          data = response.data.result;
          if(data.message) {
               message = data.message;
          }
     } else {
          const error = getErrorMessage({ statusCode: response.status, problem: response.problem, sendToSentry: true });
          logErrorMessage(response);
          message = error.message;
     }

     let morePages = true;
     if (data?.page_current === data?.page_total) {
          morePages = false;
     } else if (data?.page_total === 1) {
          morePages = false;
     }

     let items = [];
     if (data.items) {
          items = Object.values(data.items);
     }

     return {
          results: items,
          totalRecords: data.totalResults ?? 0,
          curPage: data.page_current ?? 0,
          totalPages: data.page_total ?? 0,
          hasMore: morePages,
          message: message,
          error: false,
     };
}