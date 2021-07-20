import "./IssueForm.scss";

import { Component } from "react";

import { IIssue, ILabel, IRepository } from "../../utils/types";
import { LabelSelector } from "./LabelSelector";
import { MarkDownEditor as MarkdownEditor } from "./MarkdownEditor";

interface IssueFormProps {
    issue: IIssue;
    target?: IIssue;
    repo?: IRepository;
    onChange: (issue: IIssue) => void;
}
//
export class IssueForm extends Component<IssueFormProps> {
    onChangeTitle = (title: string): void => {
        this.props.onChange({ ...this.props.issue, title });
    };

    onChangeBody = (body: string): void => {
        this.props.onChange({ ...this.props.issue, body });
    };

    onChangeLabels = (labels: ILabel[]): void => {
        this.props.onChange({ ...this.props.issue, labels });
    };

    render() {
        const { issue, target, repo } = this.props;
        const create = target?.id === undefined;

        return (
            <form className="issue-form">
                {create && (
                    <div className="field">
                        <label htmlFor="issue-title" className="label">
                            Title
                        </label>
                        <div className="control">
                            <input
                                className="input"
                                name="issue-title"
                                id="issue-title"
                                value={issue.title}
                                onChange={(ev) =>
                                    this.onChangeTitle(ev.target.value)
                                }
                            />
                        </div>
                    </div>
                )}
                <div className="field">
                    <label htmlFor="body" className="label">
                        Description
                    </label>
                    <div className="control">
                        <MarkdownEditor
                            value={issue.body}
                            onChange={this.onChangeBody}
                        />
                    </div>
                </div>
                {repo && (
                    <div className="field">
                        <label htmlFor="label-selector" className="label">
                            Labels
                        </label>
                        <div className="control">
                            <LabelSelector
                                repo={repo}
                                target={target}
                                onChange={this.onChangeLabels}
                            />
                        </div>
                    </div>
                )}
            </form>
        );
    }
}
