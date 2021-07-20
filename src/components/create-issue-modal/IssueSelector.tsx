import "./IssueSelector.scss";

import chroma from "chroma-js";
import isEqual from "lodash/isEqual";
import { Component } from "react";
import { RiBug2Line, RiDiscussLine } from "react-icons/ri";
import Select from "react-select";
import { browser } from "webextension-polyfill-ts";

import { toastResponse } from "../../utils/toasts";
import { ACTIONS, IGetIssuesMessage, IIssue, IRepository, IResponse } from "../../utils/types";
import { textColour } from "../../utils/utils";

interface IssueSelectorProps {
    repo: IRepository;
    onChange: (issue: IIssue | null) => void;
}

interface IssueSelectorState {
    issues: IIssue[];
    loading: boolean;
    selected?: IIssue;
}

const createNewIssue: IIssue = {
    title: "Create new Issue",
    author: "",
    body: "",
    labels: [],
};

export class IssueSelector extends Component<
    IssueSelectorProps,
    IssueSelectorState
> {
    state: IssueSelectorState = {
        issues: [createNewIssue],
        loading: false,
    };

    componentDidMount = () => {
        this.getIssues();
    };

    componentDidUpdate = (prevProps: IssueSelectorProps) => {
        if (!isEqual(prevProps.repo, this.props.repo)) {
            this.getIssues();
        }
    };

    getIssues = async () => {
        if (!this.props.repo) return;
        this.setState({ loading: true });
        const message: IGetIssuesMessage = {
            action: ACTIONS.GET_ISSUES,
            repo: this.props.repo,
        };

        const response: IResponse<IIssue[]> = await browser.runtime.sendMessage(
            message
        );

        if (response.success) {
            this.setState({
                issues: [
                    createNewIssue,
                    ...response.content.sort((a, b) =>
                        a.title
                            .toLowerCase()
                            .localeCompare(b.title.toLowerCase())
                    ),
                ],
                loading: false,
            });
        } else {
            this.setState({ loading: false });
            toastResponse(response);
        }
    };

    onChangeIssue = (issue: IIssue | null) => {
        this.props.onChange(issue);
        this.setState({ selected: issue ?? undefined });
    };

    getOptionValue = (option: IIssue) => {
        return option.id?.toString() || "new";
    };

    formatIssueOption = (issue: IIssue) => {
        return (
            <div className="issue-option">
                {!issue.id && (
                    <div className="issue-icon">
                        <RiBug2Line
                            fontSize="larger"
                            style={{
                                marginRight: ".5em",
                                position: "relative",
                                top: "3px",
                            }}
                        />
                    </div>
                )}
                {!!issue.id && (
                    <div className="issue-icon">
                        <RiDiscussLine
                            fontSize="larger"
                            style={{
                                marginRight: ".5em",
                                position: "relative",
                                top: "3px",
                            }}
                        ></RiDiscussLine>
                        <div className="comment-count">
                            {issue.comments ?? 0}
                        </div>
                    </div>
                )}
                <div className="issue-label">{issue.title}</div>
                {issue.labels?.length > 0 &&
                    issue.labels.map((label) => (
                        <span
                            className="label-tag"
                            key={label.name}
                            style={{
                                color: textColour(chroma(label.color)).hex(),
                                background: `#${label.color}`,
                            }}
                        >
                            {label.name}
                        </span>
                    ))}
            </div>
        );
    };

    filterIssueOption = (option: IIssue, filter: string): boolean => {
        return !!option.title.match(new RegExp(filter, "i"));
    };

    render() {
        const { issues, selected, loading } = this.state;

        return (
            <>
                <label htmlFor="issue-selector" className="label">
                    Issue
                </label>
                <Select
                    id="issue-selector"
                    onChange={this.onChangeIssue}
                    value={selected}
                    defaultValue={issues[0]}
                    getOptionValue={this.getOptionValue}
                    formatOptionLabel={this.formatIssueOption}
                    filterOption={(option, filter) =>
                        this.filterIssueOption(option.data, filter)
                    }
                    options={issues}
                    styles={{
                        menuPortal: (base) => ({
                            ...base,
                            zIndex: 9999,
                        }),
                        control: (base) => ({
                            ...base,
                            backgroundColor: "#FAFBFC",
                        }),
                    }}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                    isLoading={loading}
                ></Select>
            </>
        );
    }
}
