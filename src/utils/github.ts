import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { xorWith } from 'lodash';

import { getGithubUser } from './storage';
import {
    ERRORS,
    IAddIssueCommentMessage,
    ICreateIssueMessage,
    IGetIssuesMessage,
    IGetRepoLabelsMessage,
    IGetRepositoriesMessage,
    IGithubUser,
    IIssue,
    ILabel,
    IRepository,
    IResponse,
    RESPONSE_ACTIONS,
} from './types';

export async function getBearerInfo(token: string): Promise<IGithubUser> {
    const octo = new Octokit({
        auth: token,
    });
    const { data } = await octo.users.getAuthenticated();
    const { login: user, avatar_url: avatar } = data;
    return { user, avatar, token };
}

export async function createIssue(
    message: ICreateIssueMessage
): Promise<
    IResponse<RestEndpointMethodTypes["issues"]["create"]["response"]["data"]>
> {
    try {
        const user = await getGithubUser();
        if (!user) throw ERRORS.GITHUB_USER_NOT_SET;

        const { mod, issue } = message;
        if (!mod.github) throw ERRORS.UNKNOWN_REPO;

        const octo = new Octokit({
            auth: user.token,
        });

        const response = await octo.issues.create({
            ...mod.github,
            ...issue,
            labels: issue.labels.map((label) => label.name),
        });

        return {
            success: true,
            content: response.data,
            update: {
                status: "info",
                message: `Created issue '${issue.title}' (#${response.data.number})`,
                link: response.data.html_url,
            },
        };
    } catch (err) {
        let action: RESPONSE_ACTIONS | undefined;
        if (err == ERRORS.GITHUB_USER_NOT_SET || err == ERRORS.UNKNOWN_REPO)
            action = RESPONSE_ACTIONS.OPEN_OPTIONS;
        return {
            success: false,
            action,
            update: { status: "danger", message: `${err}` },
        };
    }
}

export async function addIssueComment(
    message: IAddIssueCommentMessage
): Promise<
    IResponse<
        RestEndpointMethodTypes["issues"]["createComment"]["response"]["data"]
    >
> {
    try {
        const user = await getGithubUser();
        if (!user) throw ERRORS.GITHUB_USER_NOT_SET;

        const { mod, target, issue } = message;
        if (!mod.github) throw ERRORS.UNKNOWN_REPO;

        const octo = new Octokit({
            auth: user.token,
        });

        // check if we need to update labels
        const updateLabels = xorWith(
            issue.labels,
            target.labels,
            (a, b) => a.name === b.name
        ).length;
        if (updateLabels) {
            await octo.issues.update({
                ...mod.github,
                issue_number: issue.id!,
                labels: issue.labels.map((l) => l.name),
            });
        }

        // add comment
        const commentResponse = await octo.issues.createComment({
            ...mod.github,
            issue_number: target.id!,
            body: issue.body,
        });

        const statusMessage = updateLabels
            ? `Labels updated and comment added for '${target.title}' (#${target.id})`
            : `Comment added to '${target.title}' (#${target.id})`;

        return {
            success: true,
            content: commentResponse.data,
            update: {
                status: "info",
                message: statusMessage,
                link: commentResponse.data.html_url,
            },
        };
    } catch (err) {
        let action: RESPONSE_ACTIONS | undefined;
        if (err == ERRORS.GITHUB_USER_NOT_SET || err == ERRORS.UNKNOWN_REPO)
            action = RESPONSE_ACTIONS.OPEN_OPTIONS;
        return {
            success: false,
            action,
            update: { status: "danger", message: `${err}` },
        };
    }
}

let cached_repos: IRepository[];
export async function getRepositories(
    message: IGetRepositoriesMessage
): Promise<IResponse<IRepository[]>> {
    try {
        const user = await getGithubUser();
        if (!user) throw ERRORS.GITHUB_USER_NOT_SET;

        let repos: IRepository[];
        if (cached_repos && !message.force_refresh) {
            repos = cached_repos;
        } else {
            const octo = new Octokit({
                auth: user.token,
            });

            repos = await octo
                .paginate(octo.repos.listForAuthenticatedUser, {})
                .then(
                    (
                        data: RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]["data"]
                    ) => {
                        return data.map((repo) => ({
                            repo: repo.name,
                            owner: repo.owner?.login ?? "unknown",
                        }));
                    }
                );
            cached_repos = repos;
        }

        return {
            success: true,
            content: repos,
        };
    } catch (err) {
        let action: RESPONSE_ACTIONS | undefined;
        if (err == ERRORS.GITHUB_USER_NOT_SET || err == ERRORS.UNKNOWN_REPO)
            action = RESPONSE_ACTIONS.OPEN_OPTIONS;
        return {
            success: false,
            action,
            update: { status: "danger", message: `${err}` },
        };
    }
}

const cached_issues: { [repo: string]: IIssue[] } = {};
export async function getRepositoryIssues(
    message: IGetIssuesMessage
): Promise<IResponse<IIssue[]>> {
    try {
        const user = await getGithubUser();
        if (!user) throw ERRORS.GITHUB_USER_NOT_SET;

        let issues: IIssue[];
        let repoKey = message.repo.owner + "/" + message.repo.repo;
        if (cached_issues[repoKey] && !message.force_refresh) {
            issues = cached_issues[repoKey];
        } else {
            const octo = new Octokit({
                auth: user.token,
            });

            issues = await octo
                .paginate(octo.issues.listForRepo, { ...message.repo })
                .then((data) => {
                    return data.map((issue) => ({
                        id: issue.number,
                        title: issue.title,
                        body: issue.body ?? "",
                        author: issue.user?.login ?? "unknown",
                        labels: issue.labels.map(({ name, color }) => ({
                            name,
                            color,
                        })),
                    }));
                });
            cached_issues[repoKey] = issues;
        }

        return {
            success: true,
            content: issues,
        };
    } catch (err) {
        let action: RESPONSE_ACTIONS | undefined;
        if (err == ERRORS.GITHUB_USER_NOT_SET || err == ERRORS.UNKNOWN_REPO)
            action = RESPONSE_ACTIONS.OPEN_OPTIONS;
        return {
            success: false,
            action,
            update: {
                status: "danger",
                message: `${err}`,
            },
        };
    }
}

const cached_labels: { [repo: string]: ILabel[] } = {};
export async function getRepositoryLabels(
    message: IGetRepoLabelsMessage
): Promise<IResponse<ILabel[]>> {
    try {
        const user = await getGithubUser();
        if (!user) throw ERRORS.GITHUB_USER_NOT_SET;

        let labels: ILabel[];
        let repoKey = message.repo.owner + "/" + message.repo.repo;

        if (cached_labels[repoKey] && !message.force_refresh) {
            labels = cached_labels[repoKey];
        } else {
            const octo = new Octokit({
                auth: user.token,
            });

            labels = await octo
                .paginate(octo.issues.listLabelsForRepo, { ...message.repo })
                .then((data) => {
                    return data.map((label) => ({
                        ...label,
                    }));
                });
            cached_labels[repoKey] = labels;
        }

        return {
            success: true,
            content: labels,
        };
    } catch (err) {
        console.error(err);
        let action: RESPONSE_ACTIONS | undefined;
        if (err == ERRORS.GITHUB_USER_NOT_SET || err == ERRORS.UNKNOWN_REPO)
            action = RESPONSE_ACTIONS.OPEN_OPTIONS;
        return {
            success: false,
            action,
            update: { status: "danger", message: `${err}` },
        };
    }
}
