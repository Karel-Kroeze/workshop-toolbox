import "./ReplyWidget.scss";

import cx from "classnames";
import React, { ChangeEvent, Component, FormEvent, KeyboardEvent } from "react";
import { createRef } from "react";
import { RiMailSendLine, RiQuestionLine } from "react-icons/ri";
import ReactTooltip from "react-tooltip";

import { getQuickReplies } from "../../utils/storage";
import { renderQuickReply } from "../../utils/template";
import { IMod, IQuickReply } from "../../utils/types";

interface ReplyWidgetProps {
    author: string;
    mod: IMod;
    text?: string;
    onSubmit: (author: string, text: string) => void;
}

interface ReplyWidgetState {
    text: string;
    author: string;
    quickReplies?: IQuickReply[];
    quickReplyDropdownActive?: boolean;
    loading?: boolean;
}
export class ReplyWidget extends Component<ReplyWidgetProps, ReplyWidgetState> {
    constructor(props: ReplyWidgetProps) {
        super(props);

        this.state = {
            text: props.text ?? "",
            author: props.author,
        };
    }

    inputRef = createRef<HTMLTextAreaElement>();

    componentDidMount() {
        this.getQuickReplies();
        this.inputRef.current?.focus();
    }

    componentDidUpdate(prevProps: ReplyWidgetProps) {
        if (prevProps.author !== this.props.author) {
            this.setState(
                {
                    text: this.props.text ?? "",
                    author: this.props.author,
                },
                () => {
                    this.inputRef.current?.focus();
                }
            );
        }
    }

    openQuickReplies = () => {
        this.setState({ quickReplyDropdownActive: true });
    };

    closeQuickReplies = () => {
        this.setState({ quickReplyDropdownActive: false });
    };

    getQuickReplies = async () => {
        this.setState({ loading: true });
        const quickReplies = (await getQuickReplies()) || [];
        this.setState({ quickReplies, loading: false });
    };

    insertQuickReply = (quickReply: IQuickReply) => {
        const mod = this.props.mod.name;
        const repo = this.props.mod.github?.repo
            ? `${this.props.mod.github?.repo}/${this.props.mod.github?.repo}`
            : undefined;
        const author = this.state.author;
        const reply = renderQuickReply(quickReply, { mod, repo, author });
        this.setState(
            {
                text: `${this.state.text} ${reply}`,
            },
            () => {
                this.inputRef.current?.focus();
            }
        );
        this.closeQuickReplies();
    };

    changeText = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const text = event.currentTarget.value;
        this.setState({ ...this.state, text });
    };

    changeAuthor = (event: ChangeEvent<HTMLSpanElement>) => {
        const author = event.currentTarget.innerText;
        this.setState({ ...this.state, author });
    };

    onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.stopPropagation();
        event.preventDefault();
        this.submit();
    };

    onKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        console.log({ key: event.key });

        if (event.key === "Escape") {
            this.cancel();
        }
        if (event.key === "Enter" && event.ctrlKey) {
            this.submit();
        }
    };

    submit = () => {
        this.props.onSubmit(this.state.author, this.state.text);
        this.close();
    };

    cancel = () => {
        this.close();
    };

    close = () => {
        this.setState({ text: "", author: "" });
        this.closeQuickReplies();
        this.inputRef.current?.blur();
        ReactTooltip.hide();
    };

    render() {
        const { text, loading, quickReplies, quickReplyDropdownActive } =
            this.state;
        const hasQuickReplies = quickReplies && quickReplies.length > 0;
        return (
            <form className="reply-widget" onSubmit={this.onSubmit}>
                <div className="header">
                    <div className="help">
                        @
                        <span
                            contentEditable
                            suppressContentEditableWarning
                            onInput={this.changeAuthor}
                            tabIndex={2}
                        >
                            {this.props.author}
                        </span>
                        :
                    </div>
                    <div className="icons">
                        <div
                            className={cx("dropdown", {
                                "is-active": quickReplyDropdownActive,
                            })}
                            onMouseLeave={this.closeQuickReplies}
                        >
                            <div
                                className="dropdown-trigger"
                                onClick={this.openQuickReplies}
                            >
                                <RiMailSendLine
                                    data-for="reply-icon-tooltip"
                                    data-tip="Quick Replies"
                                    tabIndex={3}
                                />
                            </div>
                            <div className="dropdown-menu">
                                <div className="dropdown-content">
                                    {loading && (
                                        <button className="is-info is-inverted is-loading is-small dropdown-item">
                                            loading...
                                        </button>
                                    )}
                                    {!loading && !hasQuickReplies && (
                                        <button className="is-info is-inverted is-small dropdown-item">
                                            manage quick replies
                                        </button>
                                    )}
                                    {!loading &&
                                        hasQuickReplies &&
                                        this.state.quickReplies!.map(
                                            (reply) => (
                                                <a
                                                    className="dropdown-item"
                                                    onClick={() =>
                                                        this.insertQuickReply(
                                                            reply
                                                        )
                                                    }
                                                    key={reply.label}
                                                >
                                                    {reply.label}
                                                </a>
                                            )
                                        )}
                                </div>
                            </div>
                        </div>
                        <RiQuestionLine
                            data-for="reply-icon-tooltip"
                            data-tip={
                                "<kbd>Ctrl</kbd>+<kbd>Enter</kbd> to 'post' comment.<br /><kbd>Esc</kbd> to cancel comment." +
                                "<br />Use <b>Quick Replies</b> to answer common questions."
                            }
                            tabIndex={4}
                        />
                    </div>
                </div>
                <textarea
                    className="input"
                    value={text}
                    onChange={this.changeText}
                    onKeyDown={this.onKeyPress}
                    onKeyPress={this.onKeyPress}
                    tabIndex={1}
                    ref={this.inputRef}
                />
                <ReactTooltip
                    id="reply-icon-tooltip"
                    className="tooltip"
                    effect="solid"
                    type="light"
                    html={true}
                    getContent={(tip) => tip}
                />
            </form>
        );
    }
}
