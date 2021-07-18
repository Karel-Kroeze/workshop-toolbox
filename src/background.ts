import { browser } from 'webextension-polyfill-ts';

import { authorize } from './utils/auth';
import { addIssueComment, createIssue, getRepositories, getRepositoryIssues, getRepositoryLabels } from './utils/github';
import { ACTIONS, IResponse, Message } from './utils/types';

browser.runtime.onMessage.addListener(
    async (message: Message): Promise<IResponse<any> | true> => {
        switch (message.action) {
            case ACTIONS.CREATE_ISSUE:
                return createIssue(message);
            case ACTIONS.AUTHORIZE:
                return authorize();
            case ACTIONS.OPEN_OPTIONS:
                try {
                    browser.runtime.openOptionsPage();
                } catch (err) {
                    console.error(err);
                }
                return true;
            case ACTIONS.GET_REPOS:
                return getRepositories(message);
            case ACTIONS.GET_ISSUES:
                return getRepositoryIssues(message);
            case ACTIONS.GET_REPO_LABELS:
                return getRepositoryLabels(message);
            case ACTIONS.ADD_ISSUE_COMMENT:
                return addIssueComment(message);
        }

        // @ts-expect-error safeguard for unknown actions
        console.log(`unknown action: ${message.action}`);
    }
);
