import { createAuthTokens, getHeaders, postData } from "./apiAuth";
import { GLOBALS } from "./globals";
import { create } from "apisauce";

export async function trackAppLaunches(url) {
	try {
		const postBody = await postData();
		const api = create({
			baseURL: url + '/API',
			timeout: GLOBALS.timeoutAverage,
			headers: getHeaders(true),
			auth: createAuthTokens(),
		});
		const response = await api.post('/UserAPI?method=trackAppLaunches', postBody);
		return response.ok;
	} catch (error) {
		console.error('Failed to track app launch: ', error);
		return false;
	}
}

export async function trackAppResume(url) {
	try {
		const postBody = await postData();
		const api = create({
			baseURL: url + '/API',
			timeout: GLOBALS.timeoutAverage,
			headers: getHeaders(true),
			auth: createAuthTokens(),
		});
		const response = await api.post('/UserAPI?method=trackAppResume', postBody);
		return response.ok;
	} catch (error) {
		console.error('Failed to track app resume: ', error);
		return false;
	}
}