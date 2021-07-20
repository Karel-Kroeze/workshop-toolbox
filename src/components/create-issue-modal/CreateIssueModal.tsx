import { Component } from "react";

import { getModInfo, setModInfo } from "../../utils/storage";
import { ERRORS, IIssue, IMod, IRepository } from "../../utils/types";
import { DefaultRepoIcon as DefaultRepoToggle } from "./DefaultRepoToggle";
import { IssueForm } from "./IssueForm";
import { IssueSelector } from "./IssueSelector";
import { RepoSelector } from "./RepoSelector";

interface CreateIssueModalProps {
    mod: IMod;
    issue: IIssue;
    promise: {
        resolve: (
            value: CreateIssueModalState | PromiseLike<CreateIssueModalState>
        ) => void;
        reject: (error: any) => void;
    };
}

export interface CreateIssueModalState {
    mod: IMod;
    target?: IIssue;
    issue: IIssue;
    repo?: IRepository;
}

export class CreateIssueModal extends Component<
    CreateIssueModalProps,
    CreateIssueModalState
> {
    state: CreateIssueModalState;

    constructor(props: CreateIssueModalProps) {
        super(props);

        const { mod, issue } = props;
        this.state = { mod, issue };
        this.getDefaultRepo();
    }

    cancel = () => {
        this.props.promise.reject(ERRORS.USER_CANCELED_ISSUE);
    };

    submit = () => {
        this.props.promise.resolve({ ...this.state });
    };

    onChangeRepo = (repo: IRepository) => {
        this.setState({ repo });
    };

    onChangeTarget = (issue: IIssue | null) => {
        this.setState({ target: issue ? { ...issue } : undefined });
    };

    onChangeIssue = (issue: IIssue) => {
        this.setState({ issue: { ...issue } });
    };

    getDefaultRepo = async () => {
        const { mod } = this.state;
        const stored = await getModInfo(mod.publishedFileId);
        if (stored?.github) {
            this.setState({
                repo: stored.github,
                mod: { ...mod, github: stored.github },
            });
        }
    };

    setDefaultRepo = () => {
        this.state.mod.github = this.state.repo;
        setModInfo(this.state.mod);
        this.setState({
            mod: { ...this.state.mod },
        });
    };

    render() {
        const { mod, target, issue, repo } = this.state;
        const create = target?.id === undefined;
        return (
            <div className="workshop-toolbox">
                <div className="modal create-issue-modal is-active">
                    <div
                        className="modal-background"
                        onClick={this.cancel}
                    ></div>
                    <div className="modal-content">
                        <div className="box">
                            <h2 className="title">Post issue to GitHub</h2>

                            <div
                                style={{
                                    display: "flex",
                                    alignContent: "space-between",
                                }}
                            >
                                <label
                                    htmlFor="repo-selector"
                                    className="label"
                                    style={{ marginBottom: 0, flexGrow: 1 }}
                                >
                                    Repository
                                </label>
                                <DefaultRepoToggle
                                    mod={mod}
                                    repo={repo}
                                    setDefault={this.setDefaultRepo}
                                />
                            </div>
                            <RepoSelector
                                repo={repo}
                                onChange={this.onChangeRepo}
                            />
                            {mod.github && (
                                <IssueSelector
                                    repo={mod.github}
                                    onChange={this.onChangeTarget}
                                />
                            )}
                            <IssueForm
                                target={target}
                                issue={issue}
                                repo={mod.github}
                                onChange={this.onChangeIssue}
                            />
                            <button
                                type="submit"
                                className="button is-primary is-pulled-right ml-4"
                                onClick={this.submit}
                            >
                                {create ? "Create issue" : "Add comment"}
                            </button>
                            <button
                                type="button"
                                className="button is-danger is-outlined is-pulled-right"
                                onClick={this.cancel}
                            >
                                Cancel
                            </button>
                            <div className="is-clearfix"></div>
                        </div>
                    </div>
                    <button
                        className="modal-close"
                        onClick={this.cancel}
                    ></button>
                </div>
            </div>
        );
    }
}
