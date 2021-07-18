import { browser } from 'webextension-polyfill-ts';

import { CLIENT_ID, PROXY_URL } from './config';
import { getBearerInfo } from './github';
import { setGitHubUser } from './storage';
import { ERRORS, IGithubUser, IResponse } from './types';

const AUTH_URL = "https://github.com/login/oauth/authorize";
const SCOPES = ["public_repo", "read:user"];

export async function authorize(): Promise<IResponse<IGithubUser>> {
    try {
        const redirectUrl = browser.identity.getRedirectURL();
        let authUrl = AUTH_URL;
        authUrl += `?client_id=${CLIENT_ID}`;
        authUrl += `&redirect_uri=${encodeURIComponent(redirectUrl)}`;
        authUrl += `&scope=${encodeURIComponent(SCOPES.join(" "))}`;
        const response = await browser.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true,
        });
        const url = new URL(response);
        const code = url.searchParams.get("code");
        console.log({ code });
        if (!code) throw ERRORS.GITHUB_AUTH_NO_CODE;

        const tokenResponse = await fetch(
            `${PROXY_URL}?code=${encodeURIComponent(code)}`
        );
        const tokenJson = await tokenResponse.json();
        const { error, error_description, access_token } = tokenJson;
        console.log({ tokenJson });
        if (error) throw new Error(`${error}: ${error_description}`);

        const user = await getBearerInfo(access_token);
        await setGitHubUser(user);
        return {
            success: true,
            content: user,
            update: {
                status: "success",
                message: `Authenticated as ${user.user}`,
            },
        };
    } catch (error) {
        console.error({ error });
        return {
            success: false,
            update: {
                status: "danger",
                message: `${error}`,
            },
        };
    }
}
