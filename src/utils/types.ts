export enum ACTIONS {
    CREATE_ISSUE = "create-issue",
    AUTHORIZE = "authorize",
    OPEN_OPTIONS = "open-options",
    GET_REPOS = "get-repos",
    GET_ISSUES = "get-issues",
    GET_REPO_LABELS = "get-repo-labels",
    ADD_ISSUE_COMMENT = "add-issue-comment",
}
export enum ERRORS {
    UNKNOWN_REPO = "This mod does not have an associated GitHub repository",
    GITHUB_USER_NOT_SET = "No GitHub user has been linked",
    GITHUB_AUTH_NO_CODE = "GitHub auth did not return a temporary auth code",
    USER_CANCELED_ISSUE = "Issue creation cancelled",
    GITHUB_ISSUE_DOES_NOT_EXIST = "This issue is not available on GitHub",
}
export enum RESPONSE_ACTIONS {
    OPEN_OPTIONS = "open-options",
}
export type IResponse<T = void> = ISuccessResponse<T> | IFailureResponse;
export type Status = "success" | "info" | "warning" | "danger";
export interface IStatusUpdate {
    message: string;
    status: Status;
    link?: string;
    onClick?: Function;
}

export interface IResponseBase {
    success: boolean;
    update?: IStatusUpdate;
}

export interface ISuccessResponse<T> extends IResponseBase {
    success: true;
    content: T;
    action?: RESPONSE_ACTIONS;
}

export interface IFailureResponse extends IResponseBase {
    success: false;
    action?: RESPONSE_ACTIONS;
    update: IStatusUpdate;
}

interface IMessage {
    action: ACTIONS;
}

export interface ICreateIssueMessage extends IMessage {
    action: ACTIONS.CREATE_ISSUE;
    mod: IMod;
    issue: IIssue;
}
export interface IAddIssueCommentMessage extends IMessage {
    action: ACTIONS.ADD_ISSUE_COMMENT;
    mod: IMod;
    issue: IIssue;
    target: IIssue;
}
export interface IObtainTokenMessage extends IMessage {
    action: ACTIONS.AUTHORIZE;
}
export interface IOpenOptionsMessage extends IMessage {
    action: ACTIONS.OPEN_OPTIONS;
}
export interface IGetRepositoriesMessage extends IMessage {
    action: ACTIONS.GET_REPOS;
    force_refresh?: boolean;
}
export interface IGetIssuesMessage extends IMessage {
    action: ACTIONS.GET_ISSUES;
    force_refresh?: boolean;
    repo: IRepository;
}
export interface IGetRepoLabelsMessage extends IMessage {
    action: ACTIONS.GET_REPO_LABELS;
    force_refresh?: boolean;
    repo: IRepository;
}

export type Message =
    | ICreateIssueMessage
    | IObtainTokenMessage
    | IOpenOptionsMessage
    | IGetRepositoriesMessage
    | IGetIssuesMessage
    | IGetRepoLabelsMessage
    | IAddIssueCommentMessage;
export type Reply = (response: IResponse<any>) => void;

export interface IMod {
    publishedFileId: number;
    name: string;
    github?: IRepository;
}

export interface IIssue {
    title: string;
    body: string;
    author: string;
    labels: ILabel[];
    source?: string;
    id?: number;
    comments?: number;
}

export interface ILabel {
    name: string;
    color: string;
}

export interface IRepository {
    owner: string;
    repo: string;
}

export interface IGithubUser {
    user: string;
    token: string;
    avatar?: string;
}

export type NonFunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

export interface IQuickReply {
    label: string;
    content: string;
}
