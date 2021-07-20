import { css } from "@emotion/react";
import { omit } from "lodash";
import { HTMLAttributes } from "react";
import { useState } from "react";
import { RiMailSendLine } from "react-icons/ri";

import { IQuickReply } from "../../utils/types";

interface IProps {
    quickReplies: IQuickReply[];
    onSelect: (quickReply: IQuickReply) => void;
}

export const QuickReplyDropdown = (
    props: IProps & Omit<HTMLAttributes<HTMLDivElement>, keyof IProps>
) => {
    const [isOpen, setOpen] = useState(false);
    const divProps = omit(props, ["onSelect", "quickReplies"]);

    let closeTimeout: number | null;
    const close = () => {
        closeTimeout = window.setTimeout(() => {
            setOpen(false);
            closeTimeout = null;
        }, 100);
    };
    const cancelClose = () => {
        if (closeTimeout) {
            window.clearTimeout(closeTimeout);
        }
    };
    const toggleOpen = () => {
        setOpen(!isOpen);
    };

    return (
        <div
            {...divProps}
            onMouseLeave={close}
            onMouseEnter={cancelClose}
            css={css`
                position: relative;
                display: inline-flex;
            `}
        >
            <RiMailSendLine
                onClick={toggleOpen}
                tabIndex={3}
                css={css`
                    margin: auto;
                `}
            />
            {isOpen && (
                <div
                    css={css`
                        position: absolute;
                        right: 0;
                        top: 0.2rem;
                        z-index: 99;
                        display: flex;
                        flex-flow: column nowrap;
                        border-radius: 4px;
                        background-color: #fff;
                        width: max-content;
                    `}
                >
                    {props.quickReplies.length <= 0 ? (
                        <div css={css()}></div>
                    ) : (
                        props.quickReplies!.map((reply) => (
                            <a
                                css={css`
                                    min-width: max-content;
                                    width: 100%;
                                    padding: 0.4rem;
                                    color: #333;
                                    :hover {
                                        color: #333;
                                        background-color: rgba(0, 0, 0, 0.05);
                                    }
                                `}
                                onClick={() => {
                                    props.onSelect(reply);
                                    setOpen(false);
                                }}
                                key={reply.label}
                            >
                                {reply.label}
                            </a>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
