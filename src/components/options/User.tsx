import React, { Component } from 'react';
import { browser } from 'webextension-polyfill-ts';

import { CLIENT_ID } from '../../utils/config';
import { clearGitHubUser, getGithubUser } from '../../utils/storage';
import { ACTIONS, IGithubUser, IResponse } from '../../utils/types';
import { toastDanger, toastInfo, toastWarning } from '../../utils/utils';
import UserInfo from './UserInfo';

interface IUserState {
    user?: IGithubUser;
}

export class User extends Component<{}, IUserState> {
    state: IUserState = {};

    componentDidMount = () => {
        this.getUser();
    };

    authenticate = async () => {
        const response: IResponse = await browser.runtime.sendMessage({
            action: ACTIONS.AUTHORIZE,
        });
        if (response.success) {
            await this.getUser();
        } else {
            toastWarning("Authentication failed");
            toastDanger(response.update.message);
        }
    };

    getUser = async () => {
        const user = await getGithubUser();
        this.setState({ user });
    };

    clearUser = async () => {
        const user = this.state.user;
        if (!user) {
            toastWarning("Not logged in, no tokens to clear.");
        } else {
            await clearGitHubUser();
            this.setState({ user: undefined });
            const revokeUrl = `https://github.com/settings/connections/applications/${CLIENT_ID}`;
            toastInfo(`Logged out ${user.user}`, revokeUrl);
        }
    };

    render() {
        const { user } = this.state;

        return (
            <div className="user">
                {user && (
                    <>
                        <h4>Authenticated as</h4>
                        <div className="user-details">
                            <UserInfo user={user} />
                            <button
                                className="button is-danger"
                                onClick={this.clearUser}
                            >
                                Log out
                            </button>
                        </div>
                    </>
                )}
                {!user && (
                    <>
                        <h4>Not authenticated</h4>
                        <button
                            className="button is-info"
                            onClick={this.authenticate}
                        >
                            Authenticate with GitHub
                        </button>
                    </>
                )}
            </div>
        );
    }
}
