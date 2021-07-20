import "./content.scss";

import { css } from "@emotion/react";
import assign from "lodash/assign";
import { createPortal, render, unmountComponentAtNode } from "react-dom";
import { RiGithubFill } from "react-icons/ri";
import { ToastContainer } from "react-toastify";
import ReactTooltip from "react-tooltip";
import showdown from "showdown";
import { browser } from "webextension-polyfill-ts";

import { CreateIssueModal, CreateIssueModalState } from "./components/create-issue-modal/CreateIssueModal";
import { ReplyWidget } from "./components/reply-widget/ReplyWidget";
import { CreateCommentResponseData, CreateIssueResponseData } from "./utils/github";
import { getModInfo, setModInfo } from "./utils/storage";
import { toastContainerStyles, toastDanger, toastInfo, toastLoading, toastSuccess } from "./utils/toasts";
import { ACTIONS, ERRORS, IIssue, IMod, IResponse, Message } from "./utils/types";
import { createIssueText, extractTitle } from "./utils/utils";

showdown.setFlavor("github");
export const markdown = new showdown.Converter();

const MAX_CHARACTERS = 1000;

let commentContainer: HTMLDivElement;
let commentTextarea: HTMLTextAreaElement;
let modalContainer: HTMLDivElement;
let tooltipContainer: HTMLDivElement;
let toastContainer: HTMLDivElement;
let mod: IMod;

async function init() {
    // the container that contains comments
    commentContainer = document.querySelector<HTMLDivElement>(
        "div.commentthread_comments"
    )!;

    // the comment textarea
    commentTextarea = document
        .getElementsByClassName("commentthread_entry_quotebox")[0]
        .getElementsByTagName("textarea")[0];

    // get and update basic mod info
    const publishedFileId = parseInt(
        document
            .querySelector<HTMLLinkElement>("a.sectionTab")!
            .href.match(/(\d+)$/)![1]
    );
    const name = document
        .querySelector(".workshopItemTitle")!
        .textContent!.trim();
    mod = assign(await getModInfo(publishedFileId), { publishedFileId, name });
    setModInfo(mod);

    // add container for modals
    modalContainer = document.createElement("div");
    document.body.append(modalContainer);

    // add tooltip container
    tooltipContainer = document.createElement("div");
    document.body.append(tooltipContainer);
    render(
        <ReactTooltip
            effect="solid"
            type="light"
            className="tooltip"
            html
            css={css`
                padding: 0.4em 0.6em !important;
                border-radius: 4px;
                box-shadow: 0 0.5em 1em -0.125em rgb(10 10 10 / 10%),
                    0 0px 0 1px rgb(10 10 10 / 2%);
                background-color: white;
                opacity: 1;
            `}
        />,
        tooltipContainer
    );

    // add toast container
    toastContainer = document.createElement("div");
    document.body.append(toastContainer);
    render(<ToastContainer css={toastContainerStyles} />, toastContainer);

    // add characterCounters
    // there are two textareas, for public and private comments
    for (const entrybox of document.querySelectorAll<HTMLDivElement>(
        "div.commentthread_entry_quotebox"
    )) {
        addCharacterCounter(entrybox);
    }

    // respond to changes in the comment list (page changes)
    new MutationObserver(injectContent).observe(commentContainer, {
        childList: true,
    });

    // first run
    injectContent();
}

function injectContent() {
    createButtons();
    fixSteamStyles();
}

function fixSteamStyles() {
    for (const comment of document.querySelectorAll<HTMLDivElement>(
        ".commentthread_comment"
    )) {
        comment.style.overflow = "unset";
    }

    for (const author of document.querySelectorAll<HTMLDivElement>(
        ".commentthread_comment_author"
    )) {
        author.style.display = "flex";
        author.style.height = "1rem";
        author.style.alignContent = "flex-start";
        author.style.marginBottom = "0.3rem";
    }
    for (const action of document.querySelectorAll<HTMLDivElement>(
        ".commentthread_comment_actions"
    )) {
        action.style.float = "none";
        action.style.marginLeft = "auto";
    }
}

function createButtons() {
    const comments = document.getElementsByClassName("commentthread_comment");
    for (const comment of comments) {
        const contentContainer = comment.querySelector<HTMLDivElement>(
            ".commentthread_comment_content"
        );
        if (!contentContainer) continue;
        const actionsContainer = contentContainer.querySelector<HTMLDivElement>(
            ".commentthread_comment_actions"
        );
        if (!actionsContainer) continue;

        const author =
            contentContainer
                .querySelector(".commentthread_author_link")
                ?.textContent?.trim() ?? "";
        const quote =
            contentContainer
                .querySelector(".commentthread_comment_text")
                ?.textContent?.trim() ?? "";

        actionsContainer.insertAdjacentElement(
            "afterbegin",
            createIssueButton(author, quote)
        );

        actionsContainer.insertAdjacentElement(
            "afterbegin",
            createReplyButton(author, contentContainer)
        );
    }

    // rebind tooltips
    bindTooltips();
    ReactTooltip.rebuild();
}

/**
 * re-runs steams tooltip creation functions, creating steam-style tooltips for any new buttons.
 */
function bindTooltips() {
    // we cannot execute page scripts directly, but we can insert a script element that does it for us.
    // if it's this easy to circumvent, what is the point of sandboxing other than annoying devs?
    const scriptNode = document.createElement("script");
    const scriptBody = document.createTextNode(
        "BindTooltips(document, { tooltipCSSClass: 'community_tooltip' });"
    );
    scriptNode.appendChild(scriptBody);
    document.body.append(scriptNode);

    // clean up after ourselves
    setTimeout(() => {
        scriptNode.remove();
    }, 1000);
}

/**
 * Creates an issue button, and binds a create-issue action to it.
 *
 * @param {string} author steam user name of reportee
 * @param {string} text issue body
 */
function createIssueButton(author: string, html: string) {
    const button = document.createElement("a");
    button.addEventListener("click", createIssueHandler(author, html));
    button.classList.add("actionlink");
    button.setAttribute("data-tooltip-text", "Create Issue");
    button.innerHTML = `<img src="${browser.runtime.getURL(
        "icons/github-inv.png"
    )}" />`;
    return button;
}

function createIssueHandler(author: string, html: string): () => Promise<void> {
    return async () => {
        try {
            const md = markdown.makeMarkdown(html);
            const extractedIssue: IIssue = {
                author,
                title: extractTitle(md),
                body: createIssueText({ body: md, author }),
                labels: [{ name: "Steam", color: "#1B2838" }],
            };
            const { issue, target } = await queryUserCreateIssue(
                mod,
                extractedIssue
            );
            let message: Message;
            if (target?.id === undefined) {
                message = {
                    action: ACTIONS.CREATE_ISSUE,
                    mod,
                    issue,
                };
                const feedbackToast = toastLoading("creating issue...");
                const response: IResponse<CreateIssueResponseData> =
                    await browser.runtime.sendMessage(message);
                if (response.success) {
                    feedbackToast.success(
                        `Issue '${response.content.title}' (#${response.content.number}) created.`,
                        RiGithubFill,
                        {
                            onClick: () => {
                                open(response.content.html_url, "_blank");
                            },
                        }
                    );
                } else {
                    feedbackToast.failure(
                        `Issue creation failed: ${response.update.message}`,
                        RiGithubFill
                    );
                }
            } else {
                message = {
                    action: ACTIONS.ADD_ISSUE_COMMENT,
                    mod,
                    issue,
                    target,
                };
                const feedbackToast = toastLoading("posting comment...");
                const response: IResponse<CreateCommentResponseData> =
                    await browser.runtime.sendMessage(message);
                if (response.success) {
                    feedbackToast.success(`Comment posted.`, RiGithubFill, {
                        onClick: () => {
                            open(response.content.html_url, "_blank");
                        },
                    });
                } else {
                    feedbackToast.failure(
                        `Posting comment failed: ${response.update.message}`,
                        RiGithubFill
                    );
                }
            }
        } catch (err) {
            if (err == ERRORS.USER_CANCELED_ISSUE) {
                toastInfo(`${err}`);
            } else {
                toastDanger(`${err}`);
            }
        }
    };
}

async function queryUserCreateIssue(mod: IMod, issue: IIssue) {
    return new Promise<CreateIssueModalState>((resolve, reject) => {
        // render a react modal to get user answer.
        render(
            createPortal(
                <CreateIssueModal
                    mod={mod}
                    issue={issue}
                    promise={{ resolve, reject }}
                />,
                document.body
            ),
            modalContainer
        );
    }).finally(() => {
        unmountComponentAtNode(modalContainer);
    });
}

/**
 * Creates a reply button, and binds a reply action to it.
 *
 * @param {string} author steam user name of reply-ee
 */
function createReplyButton(author: string, contentContainer: HTMLDivElement) {
    const button = document.createElement("a");
    button.classList.add("actionlink");
    button.dataset.tooltipText = "Reply";
    button.onclick = createReplyHandler(author, contentContainer);
    button.innerHTML = `<img src="${browser.runtime.getURL(
        "icons/reply.png"
    )}" />`;
    return button;
}

let currentReplyContainer: HTMLDivElement | null = null;
function createReplyHandler(author: string, container: HTMLDivElement) {
    return () => {
        // if we're already replying to someone, close the reply
        if (currentReplyContainer) {
            unmountComponentAtNode(currentReplyContainer);
            currentReplyContainer.remove();
        }

        // create a new reply container
        const target = document.createElement("div");
        currentReplyContainer = target;
        container.appendChild(target);

        // provide a cleanup function
        const destroyWidget = () => {
            unmountComponentAtNode(target);
            container.removeChild(target);
            if (currentReplyContainer === target) {
                currentReplyContainer = null;
            }
        };

        const cancelReply = () => {
            toastInfo("reply cancelled");
            destroyWidget();
        };

        // do the thing
        render(
            <ReplyWidget
                {...{ author, mod }}
                onSubmit={replyHandler}
                onCancel={cancelReply}
            />,
            target
        );
        ReactTooltip.rebuild();
    };
}

async function replyHandler(
    text: string,
    focus: boolean = false
): Promise<void> {
    if (commentTextarea.value && !commentTextarea.value.endsWith("\n"))
        commentTextarea.value += "\n";
    commentTextarea.value += text;
    commentTextarea.blur();
    if (focus) {
        commentTextarea.focus();
    }
    toastSuccess("Reply Added");
}

function addCharacterCounter(entrybox: HTMLElement) {
    let textarea = entrybox.getElementsByTagName("textarea")[0];
    let countText = document.createElement("div");
    countText.classList.add("count-text");
    entrybox.appendChild(countText);

    function updateCount() {
        let count = textarea.value.length;
        if (count > MAX_CHARACTERS) {
            countText.innerText = `${count - MAX_CHARACTERS} characters over.`;
            countText.classList.toggle("count-over", true);
        } else {
            countText.innerText = `${
                MAX_CHARACTERS - count
            } characters remaining.`;
            countText.classList.toggle("count-over", false);
        }
    }

    updateCount();
    textarea.addEventListener("change", updateCount, false);
    textarea.addEventListener("input", updateCount, false);
    textarea.addEventListener("focus", updateCount, false);
    textarea.addEventListener("blur", updateCount, false);

    // TODO: add a less hacky way to update after pasting text from reply widget
    setInterval(updateCount, 500);
}

init();
