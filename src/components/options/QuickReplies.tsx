import cx from 'clsx';
import { omit } from 'lodash';
import React, { FormEvent, PropsWithChildren, ReactElement } from 'react';
import { cloneElement } from 'react';
import { useState } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { RiQuestionLine } from 'react-icons/ri';
import ReactTooltip from 'react-tooltip';

import { deleteQuickReply, getQuickReplies, setQuickReply } from '../../utils/storage';
import { IQuickReply } from '../../utils/types';
import { toastWarning } from '../../utils/utils';

export const QuickReplyOptions = () => {
    const [replies, setReplies] = useState<IQuickReply[]>([]);

    getQuickReplies().then(setReplies);

    const deleteReply = async (
        reply: IQuickReply
    ): Promise<string | undefined> => {
        await deleteQuickReply(reply);
        setReplies(await getQuickReplies());
        return;
    };
    const updateReply = async (
        reply: IQuickReply,
        updatedReply: IQuickReply
    ): Promise<string | undefined> => {
        if (
            updatedReply.label !== reply.label &&
            (await checkExists(updatedReply))
        ) {
            return `Quick reply with label ${updatedReply.label} already exists`;
        }
        await deleteQuickReply(reply);
        await setQuickReply(updatedReply);
        setReplies(await getQuickReplies());
    };
    const createReply = async (
        reply: IQuickReply
    ): Promise<string | undefined> => {
        if (await checkExists(reply)) {
            return `Quick reply with label ${reply.label} already exists`;
        }
        await setQuickReply(reply);
        setReplies(await getQuickReplies());
    };
    const checkExists = async (reply: IQuickReply): Promise<boolean> => {
        return !!(await getQuickReplies()).find((r) => r.label === reply.label);
    };

    return (
        <div className="quick-reply-options">
            <h4 className="mb-1">Quick replies</h4>
            {replies.length > 0 ? (
                <QuickReplyList
                    replies={replies}
                    deleteReply={deleteReply}
                    updateReply={updateReply}
                />
            ) : (
                <div className="no-content">No quick replies.</div>
            )}
            <h6 className="mt-5 mb-1">Create new quick reply</h6>
            <QuickReplyEditor
                submitButton={
                    <button type="submit" className="button is-primary ml-2">
                        Create
                    </button>
                }
                onSubmit={createReply}
                clearAfterSubmit
            />
        </div>
    );
};

const QuickReplyList = (props: {
    replies: IQuickReply[];
    deleteReply: (reply: IQuickReply) => Promise<string | undefined>;
    updateReply: (
        reply: IQuickReply,
        updatedReply: IQuickReply
    ) => Promise<string | undefined>;
}) => {
    return (
        <div className="quick-replies">
            {props.replies.map((reply, index) => (
                <QuickReplyListRow
                    reply={reply}
                    key={index}
                    onDelete={() => props.deleteReply(reply)}
                    onUpdate={(updatedReply) =>
                        props.updateReply(reply, updatedReply)
                    }
                />
            ))}
        </div>
    );
};

const QuickReplyListRow = (props: {
    reply: IQuickReply;
    onDelete: () => Promise<string | undefined>;
    onUpdate: (reply: IQuickReply) => Promise<string | undefined>;
}) => {
    const [editing, setEditing] = useState<boolean>(false);
    const onSubmit = async (reply: IQuickReply) => {
        const error = await props.onUpdate(reply);
        if (error) {
            toastWarning(error);
        }
    };
    ReactTooltip.rebuild();

    return editing ? (
        <QuickReplyEditor
            className="has-background-info-light p-2"
            style={{
                borderRadius: "4px",
            }}
            reply={props.reply}
            onCancel={() => setEditing(false)}
            onSubmit={onSubmit}
            submitButton={
                <button type="submit" className="button is-primary ml-2">
                    Update
                </button>
            }
        />
    ) : (
        <div className="is-flex is-align-content-center">
            <div>{props.reply.label}</div>
            <div
                className="button is-inverted is-danger is-small ml-2"
                onClick={() => props.onDelete()}
                title="delete quick reply"
                data-tip="delete quick reply"
                data-for="options-tooltip"
            >
                <BiTrash className="icon is-small" />
            </div>
            <div
                className="button is-inverted is-info is-small ml-2"
                onClick={() => setEditing(true)}
                title="edit quick reply"
                data-tip="edit quick reply"
                data-for="options-tooltip"
            >
                <BiEdit className="icon is-small" />
            </div>
        </div>
    );
};

const QuickReplyEditor = (
    props: PropsWithChildren<{
        reply?: IQuickReply;
        submitButton?: ReactElement;
        onSubmit?: (reply: IQuickReply) => void;
        cancelButton?: ReactElement;
        onCancel?: () => void;
        clearAfterSubmit?: boolean;
    }> &
        Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit" | "onCancel">
) => {
    const [label, setLabel] = useState(props.reply?.label ?? "");
    const [content, setContent] = useState(props.reply?.content ?? "");
    const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();
        props.onSubmit?.({ label, content });
        if (props.clearAfterSubmit) {
            setLabel("");
            setContent("");
        }
    };
    const onCancel = async () => {
        props.onCancel?.();
        if (props.clearAfterSubmit) {
            setLabel("");
            setContent("");
        }
    };

    const SubmitButton = props.submitButton ?? (
        <button className="button is-primary ml-2">Save</button>
    );
    const CancelButton = props.cancelButton ?? (
        <button className="button is-danger is-inverted ml-2">Cancel</button>
    );

    return (
        <form
            {...omit(
                props,
                "onSubmit",
                "onCancel",
                "submitButton",
                "cancelButton",
                "clearAfterSubmit"
            )}
            onSubmit={onSubmit}
            className={cx(props.className, "quick-reply-editor")}
        >
            <div className="field">
                <div className="control">
                    <label htmlFor="quick-reply-label">Label</label>
                    <input
                        id="quick-reply-label"
                        type="text"
                        className="input"
                        name="label"
                        value={label}
                        onChange={(event) =>
                            setLabel(event.currentTarget.value)
                        }
                    />
                </div>
            </div>
            <div className="field">
                <div className="control">
                    <div className="is-flex">
                        <label htmlFor="quick-reply-content">Content</label>
                        <div className="icons" style={{ marginLeft: "auto" }}>
                            <RiQuestionLine
                                data-tip={
                                    "<div style='max-width: min(40vw, 400px); padding: .5em .8em;'>" +
                                    "<b>label</b> is used to identify the quick reply, and is not part of the reply itself." +
                                    "<br /><b>content</b> will be inserted as the body of the reply." +
                                    "<br/><br/>Use <code>[h1][/h1]</code> to create headers, <code>[b][/b]</code>, <code>[i][/i]</code>," +
                                    "<code>[u][/u]</code> and <code>[s][/s]</code> to create <b>bold</b>, <emph>italic</emph>, " +
                                    "<span style='text-decoration: underline;'>underlined</span> and " +
                                    "<span style='text-decoration: line-through;'>struck through</span> text," +
                                    "<code>[spoiler][/spoiler]</code> to mark <span class='spoiler'>spoilers</span> and " +
                                    "<code>[url=https://example.com]label[/url]</code> to create <a href='#'>links</a>." +
                                    "<br/><br/><code>{{mod}}</code>, <code>{{author}}</code>, and <code>{{repo}}</code>" +
                                    "will be replaced with the mod name, message author and github repository.</div>"
                                }
                                data-for="options-tooltip"
                            />
                        </div>
                    </div>
                    <textarea
                        name="content"
                        id="quick-reply-content"
                        className="input"
                        value={content}
                        onChange={(event) =>
                            setContent(event.currentTarget.value)
                        }
                        style={{
                            resize: "vertical",
                            height: "150px",
                            minHeight: "50px",
                        }}
                    />
                </div>
            </div>
            <div className="field">
                <div className="control is-flex is-justify-content-flex-end">
                    {(props.onCancel || props.cancelButton) &&
                        cloneElement(CancelButton, { onClick: onCancel })}
                    {cloneElement(SubmitButton, { onClick: onSubmit })}
                </div>
            </div>
        </form>
    );
};
