import { css } from "@emotion/react";
import { omit } from "lodash";
import React, { HTMLAttributes, KeyboardEvent, PropsWithChildren } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { RiQuestionLine } from "react-icons/ri";

import { getQuickReplies } from "../../utils/storage";
import { renderQuickReply } from "../../utils/template";
import { toastDanger } from "../../utils/toasts";
import { IMod, IQuickReply } from "../../utils/types";
import { QuickReplyDropdown } from "./QuickReplyDropdown";

interface ReplyWidgetProps {
    author: string;
    mod: IMod;
    text?: string;
    onSubmit: (text: string) => void;
    onCancel: () => void;
}

const SteamButton = (
    props: PropsWithChildren<React.HTMLAttributes<HTMLSpanElement>>
) => (
    <span
        css={css`
            border-radius: 2px;
            border: none;
            padding: 1px;
            display: inline-block;
            cursor: pointer;
            color: #d2e885 !important;
            background: linear-gradient(to bottom, #a4d007 5%, #536904 95%);

            :hover {
                background: linear-gradient(to bottom, #b6d908 5%, #80a006 95%);
            }
        `}
        {...props}
    >
        <span
            css={css`
                font-family: "Motiva Sans", Arial, Helvetica, sans-serif;
                text-align: right;
                border-radius: 2px;
                display: block;
                background: linear-gradient(to bottom, #799905 5%, #536904 95%);
                padding: 0 15px;
                font-size: 12px;
                line-height: 20px;

                :hover {
                    background: linear-gradient(
                        to bottom,
                        #a1bf07 5%,
                        #80a006 95%
                    );
                }
            `}
        >
            {props.children}
        </span>
    </span>
);

export const ReplyWidget = (
    props: Omit<HTMLAttributes<HTMLFormElement>, keyof ReplyWidgetProps> &
        ReplyWidgetProps
) => {
    const [text, setText] = useState("");
    const [quickReplies, setQuickReplies] = useState<IQuickReply[]>([]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const formProps = omit(props, [
        "author",
        "mod",
        "text",
        "onSubmit",
        "onCancel",
    ]);

    // load quick replies once
    useEffect(() => {
        getQuickReplies().then(setQuickReplies).catch(toastDanger);
    }, []);

    // clear author and text when author changes
    useEffect(() => {
        setText(`[b]@${props.author}:[/b] ${props.text ?? ""}`);
    }, [props.author]);

    const focusInput = () => {
        inputRef.current?.focus();
        resizeInput();
    };

    const resizeInput = () => {
        if (inputRef.current) {
            inputRef.current.style.height = "unset";
            inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
        }
    };

    const useQuickReply = (quickReply: IQuickReply) => {
        const mod = props.mod.name;
        const author = props.author;
        const repo = props.mod.github?.repo
            ? `${props.mod.github?.owner}/${props.mod.github?.repo}`
            : undefined;
        const reply = renderQuickReply(quickReply, { mod, repo, author });
        if (text !== "") {
            setText(text + "\n" + reply);
        } else {
            setText(reply);
        }
        focusInput();
    };

    const onKeyPress = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        resizeInput();

        if (event.key === "Escape") {
            props.onCancel();
        }
        if (event.key === "Enter" && event.ctrlKey) {
            props.onSubmit(text);
        }
    };

    return (
        <form
            {...formProps}
            css={css`
                position: relative;
                background-color: #16202d;
                margin-top: 8px;
                margin-right: 8px;
                border-radius: 4px;
                border-left: 1px solid #000;
                border-top: 1px solid #000;
                border-right: 1px solid #354357;
                border-bottom: 1px solid #354357;
            `}
            onSubmit={() => props.onSubmit(text)}
            onAbort={props.onCancel}
        >
            <textarea
                className="input"
                value={text}
                onChange={(e) => setText(e.currentTarget.value)}
                onKeyDown={onKeyPress}
                onKeyPress={onKeyPress}
                onMouseDown={resizeInput}
                onInput={resizeInput}
                onPaste={resizeInput}
                tabIndex={1}
                ref={inputRef}
                css={css`
                    flex: auto 1 1;
                    box-sizing: border-box;
                    font-size: 14px;

                    width: 100%;
                    min-height: 100px;
                    max-height: 250px;

                    resize: none;
                    padding: 4px 6px 4px 6px;
                    outline: none;
                    border: none;
                    background: none;

                    transition: 200ms ease-in-out;
                `}
            />
            <div
                css={css`
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;

                    gap: 0.2rem;
                    padding: 0.2rem;
                `}
            >
                <RiQuestionLine
                    data-tip={
                        "<kbd>Ctrl</kbd>+<kbd>Enter</kbd> to 'post' comment.<br /><kbd>Esc</kbd> to cancel comment." +
                        "<br />Use <b>Quick Replies</b> to answer common questions."
                    }
                    tabIndex={4}
                />
                <QuickReplyDropdown
                    data-tip="Quick Replies"
                    quickReplies={quickReplies}
                    onSelect={useQuickReply}
                />
                <SteamButton
                    onClick={() => {
                        props.onSubmit(text);
                    }}
                >
                    Add Reply
                </SteamButton>
            </div>
        </form>
    );
};
