import "./LabelSelector.scss";

import chroma from "chroma-js";
import isEqual from "lodash/isEqual";
import { Component } from "react";
import Select from "react-select";
import { browser } from "webextension-polyfill-ts";

import { toastResponse } from "../../utils/toasts";
import { ACTIONS, IGetRepoLabelsMessage, IIssue, ILabel, IRepository, IResponse } from "../../utils/types";
import { textColour } from "../../utils/utils";

interface LabelSelectorProps {
    repo: IRepository;
    target?: IIssue;
    onChange: (labels: ILabel[]) => void;
}
interface LabelSelectorState {
    labels: ILabel[];
    selected: ILabel[];
    loading?: boolean;
}

export class LabelSelector extends Component<
    LabelSelectorProps,
    LabelSelectorState
> {
    state: LabelSelectorState = {
        labels: [],
        selected: [],
    };

    componentDidMount = () => {
        this.getLabels();
    };

    componentDidUpdate = (prevProps: LabelSelectorProps) => {
        if (!isEqual(prevProps.repo, this.props.repo)) {
            this.getLabels();
        }
        if (!isEqual(prevProps.target, this.props.target)) {
            if (this.props.target) {
                this.setState({ selected: this.props.target.labels });
            } else {
                this.setState({ selected: [] });
            }
        }
    };

    getLabels = async () => {
        if (!this.props.repo) return;

        this.setState({ loading: true });

        const message: IGetRepoLabelsMessage = {
            action: ACTIONS.GET_REPO_LABELS,
            repo: this.props.repo,
        };
        const response: IResponse<ILabel[]> = await browser.runtime.sendMessage(
            message
        );
        if (response.success) {
            this.setState({ labels: response.content, loading: false });
        } else {
            this.setState({ loading: false });
            toastResponse(response);
        }
    };

    onChangeLabels = (labels: ILabel[]) => {
        this.props.onChange(labels);
        this.setState({ selected: labels });
    };

    optionValue = (option: ILabel) => {
        return option.name;
    };

    filterOption = (option: ILabel, filter: string) => {
        return !!option.name.match(new RegExp(filter, "i"));
    };

    render() {
        const { selected, labels, loading } = this.state;

        return (
            <Select
                id="label-selector"
                onChange={(labels) => this.onChangeLabels(labels as ILabel[])}
                value={selected}
                getOptionValue={(option) => option.name}
                getOptionLabel={(option) => option.name}
                filterOption={(option, filter) =>
                    this.filterOption(option.data, filter)
                }
                options={labels}
                styles={{
                    menuPortal: (base) => ({
                        ...base,
                        zIndex: 9999,
                    }),
                    control: (base) => ({
                        ...base,
                        backgroundColor: "#FAFBFC",
                    }),
                    multiValue: (base, { data }) => {
                        const color = chroma(data.color);
                        return {
                            ...base,
                            color: textColour(color).hex(),
                            backgroundColor: color.hex(),
                            borderRadius: "4px",
                            margin: ".2em",
                            padding: ".3em",
                            boxShadow: `1px 1px 2px ${chroma("black").alpha(
                                0.2
                            )}`,
                        };
                    },
                    multiValueLabel: (base, { data }) => ({
                        ...base,
                        color: textColour(chroma(data.color)).hex(),
                    }),
                    multiValueRemove: (base, { data }) => ({
                        ...base,
                        marginLeft: ".3em",
                        ":hover": {
                            backgroundColor: chroma(data.color)
                                .darken(0.2)
                                .hex(),
                        },
                    }),
                    option: (base, { data, isFocused }) => {
                        const background = chroma(data.color);
                        const color = textColour(background);
                        return {
                            ...base,
                            transform: isFocused ? "translate( .2em )" : "",
                            transition:
                                "transform 200ms ease-in-out, box-shadow 100ms ease-in-out",
                            color: color.hex(),
                            backgroundColor: background.hex(),
                            width: "calc( 100% - 1.5em )",
                            borderRadius: "4px",
                            margin: ".4em 1.3em .4em .8em",
                            padding: "0.4em 1em",
                            boxShadow: isFocused
                                ? `1px 1px 3px ${chroma("black").alpha(0.4)}`
                                : `1px 1px 2px ${chroma("black").alpha(0.2)}`,
                        };
                    },
                }}
                menuPortalTarget={document.body}
                menuPosition="fixed"
                isLoading={loading}
                isMulti
            ></Select>
        );
    }
}
