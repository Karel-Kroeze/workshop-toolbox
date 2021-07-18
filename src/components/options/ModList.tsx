import cx from 'classnames';
import React, { Component } from 'react';
import { BiLink, BiTrash, BiUnlink } from 'react-icons/bi';
import { RiGithubFill, RiSteamFill } from 'react-icons/ri';
import { browser } from 'webextension-polyfill-ts';

import { clearModInfo, getAllModInfo, setModInfo } from '../../utils/storage';
import { ACTIONS, IMod, IRepository, IResponse } from '../../utils/types';
import { toastDanger } from '../../utils/utils';
import { RepoSelector } from '../create-issue-modal/RepoSelector';

interface ModListState {
    mods: IMod[];
    repos?: IRepository[];
    loading?: boolean;
    openRepoDropdown?: IMod["publishedFileId"];
    closeTimer?: number;
}

export class ModList extends Component<{}, ModListState> {
    state: ModListState = { mods: [] };

    componentDidMount = async () => {
        const mods = await getAllModInfo();
        this.setState({ mods });
    };

    unsetDefault = async (mod: IMod) => {
        delete mod.github;
        await setModInfo(mod);
        this.setState({ mods: [...this.state.mods] });
    };

    forgetMod = async (mod: IMod) => {
        await clearModInfo(mod);
        this.setState({
            mods: [
                ...this.state.mods.filter(
                    (m) => m.publishedFileId !== mod.publishedFileId
                ),
            ],
        });
    };

    setDefault = async (mod: IMod, repo: IRepository) => {
        mod.github = repo;
        await setModInfo(mod);
        this.setState({ mods: [...this.state.mods] });
    };

    // fetch all repos from github
    getRepos = async () => {
        // set loading state
        this.setState({ loading: true });
        const response: IResponse<IRepository[]> =
            await browser.runtime.sendMessage({
                action: ACTIONS.GET_REPOS,
            });
        if (response.success) {
            this.setState({ repos: response.content, loading: false });
        } else {
            toastDanger(response.update.message);
            this.setState({ loading: false });
        }
    };

    openRepoDropdown = (mod: IMod) => {
        if (!this.state.repos) {
            this.getRepos();
        }
        this.setState({ openRepoDropdown: mod.publishedFileId });
    };

    closeRepoDropdown = (timeout?: number) => {
        if (timeout) {
            this.setState({
                closeTimer: window.setTimeout(this.closeRepoDropdown, timeout),
            });
        } else {
            this.setState({ openRepoDropdown: undefined });
        }
    };

    cancelCloseRepoDropdown(): void {
        if (this.state.closeTimer) {
            window.clearTimeout(this.state.closeTimer);
            this.setState({ closeTimer: undefined });
        }
    }

    render() {
        const { mods } = this.state;
        return (
            <div className="default-repo-list">
                <h4>Default repositories</h4>
                {mods.map((mod) => {
                    const workshopLink = `https://steamcommunity.com/sharedfiles/filedetails/?id=${mod.publishedFileId}`;
                    const defaultRepoSet = mod.github?.owner && mod.github.repo;
                    const defaultRepoUrl = `https://github.com/${mod.github?.owner}/${mod.github?.repo}`;

                    return (
                        <div className="mod" key={mod.publishedFileId}>
                            <div className="row">
                                <h6
                                    className="name"
                                    style={{ margin: "auto 0" }}
                                >
                                    {mod.name}
                                </h6>

                                <div
                                    className="button is-inverted is-danger is-small ml-2"
                                    title={`forget ${mod.name}`}
                                    data-tip={`forget ${mod.name}`}
                                    data-for="options-tooltip"
                                    onClick={() => this.forgetMod(mod)}
                                >
                                    <BiTrash className="icon is-small" />
                                </div>
                            </div>
                            <div className="workshop row">
                                <RiSteamFill className="mr-2" />
                                <a href={workshopLink} target="_blank">
                                    {workshopLink}
                                </a>
                            </div>
                            <div className="github row">
                                {defaultRepoSet ? (
                                    <>
                                        <RiGithubFill className="mr-2" />
                                        <a
                                            href={defaultRepoUrl}
                                            target="_blank"
                                        >
                                            {defaultRepoUrl}
                                        </a>
                                        <div
                                            className="button is-inverted is-danger is-small ml-2"
                                            title="clear default repository"
                                            data-tip="clear default repository"
                                            data-for="options-tooltip"
                                            onClick={() =>
                                                this.unsetDefault(mod)
                                            }
                                        >
                                            <BiUnlink className="icon is-small" />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <RiGithubFill className="mr-2" />
                                        <div
                                            className={cx({
                                                dropdown: true,
                                                "is-active":
                                                    this.state
                                                        .openRepoDropdown ===
                                                    mod.publishedFileId,
                                            })}
                                            onBlur={() =>
                                                this.closeRepoDropdown()
                                            }
                                            onMouseLeave={() =>
                                                this.closeRepoDropdown(250)
                                            }
                                            onMouseEnter={() =>
                                                this.cancelCloseRepoDropdown()
                                            }
                                        >
                                            <div
                                                className="dropdown-trigger"
                                                onClick={() =>
                                                    this.openRepoDropdown(mod)
                                                }
                                            >
                                                <div
                                                    className={cx(
                                                        "button is-inverted is-primary is-small",
                                                        {
                                                            "is-loading":
                                                                this.state
                                                                    .loading,
                                                        }
                                                    )}
                                                >
                                                    <BiLink className="icon is-small" />
                                                </div>
                                            </div>
                                            <div className="dropdown-menu">
                                                <div className="dropdown-content">
                                                    {this.state.repos ? (
                                                        <div
                                                            className="dropdown-item"
                                                            style={{
                                                                width: "450px",
                                                                padding: ".3em",
                                                            }}
                                                        >
                                                            <RepoSelector
                                                                repo={
                                                                    mod.github
                                                                }
                                                                onChange={(
                                                                    repo
                                                                ) =>
                                                                    this.setDefault(
                                                                        mod,
                                                                        repo
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="dropdown-item no-content">
                                                            no repos found
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }
}
