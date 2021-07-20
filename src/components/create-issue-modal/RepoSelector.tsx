import "./RepoSelector.scss";

import { Component } from "react";
import { RiGitRepositoryLine } from "react-icons/ri";
import Select, { FormatOptionLabelMeta, ValueType } from "react-select";
import { browser } from "webextension-polyfill-ts";

import { toastResponse } from "../../utils/toasts";
import { ACTIONS, IGetRepositoriesMessage, IRepository, IResponse } from "../../utils/types";

interface RepoSelectorProps {
    repo?: IRepository;
    onChange: (repo: IRepository) => void;
}

interface RepoSelectorState {
    repos: IRepository[];
    loading: boolean;
    default?: IRepository;
}

export class RepoSelector extends Component<
    RepoSelectorProps,
    RepoSelectorState
> {
    state: RepoSelectorState = {
        repos: [],
        loading: false,
    };

    static defaultProps = {
        default: true,
    };

    componentDidMount = () => {
        this.getRepos();
    };

    getRepos = async (force: boolean = false) => {
        this.setState({ loading: true });

        const message: IGetRepositoriesMessage = {
            action: ACTIONS.GET_REPOS,
            force_refresh: force,
        };
        const response: IResponse<IRepository[]> =
            await browser.runtime.sendMessage(message);
        if (response.success) {
            this.setState({
                loading: false,
                repos: response.content.sort((a, b) =>
                    a.repo.localeCompare(b.repo)
                ),
            });
        } else {
            this.setState({ loading: false });
            toastResponse(response);
        }
    };

    getRepoValue = (repo: IRepository): string => {
        return `${repo.owner}/${repo.repo}`;
    };

    setRepo = (_repo?: ValueType<IRepository, false>) => {
        const repo = _repo as IRepository;
        this.props.onChange(repo);
    };

    formatRepoOption = (
        repo: IRepository,
        meta: FormatOptionLabelMeta<IRepository, false>
    ) => {
        return (
            <div className="repo-option">
                <RiGitRepositoryLine fontSize="large" />
                <div className="repo">
                    <div className="name">{repo.repo}</div>
                    {meta.context === "menu" && (
                        <div className="owner">{repo.owner}</div>
                    )}
                </div>
            </div>
        );
    };

    render() {
        const { repos, loading } = this.state;
        const { repo } = this.props;

        return (
            <Select
                id="repo-selector"
                onChange={this.setRepo}
                value={repo}
                getOptionValue={this.getRepoValue}
                formatOptionLabel={this.formatRepoOption}
                filter
                options={repos}
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
            />
        );
    }
}
