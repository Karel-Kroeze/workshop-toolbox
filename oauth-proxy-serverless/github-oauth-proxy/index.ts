import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import fetch from 'node-fetch';

const httpTrigger: AzureFunction = async function (
    context: Context,
    req: HttpRequest
): Promise<void> {
    const { code } = req.query;
    const { GITHUB_CLIENT_ID: client_id, GITHUB_CLIENT_SECRET: client_secret } =
        process.env;

    console.log({ code, client_id, client_secret });

    const tokenResponse = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ client_id, client_secret, code }),
        }
    );
    const token = await tokenResponse.json();
    console.log({ token });

    context.res = {
        // status: 200, /* Defaults to 200 */
        body: JSON.stringify(token),
    };
};

export default httpTrigger;
