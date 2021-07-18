import './content.scss';
import 'toastify-js/src/toastify.css';

import assign from 'lodash/assign';
import React from 'react';
import { createPortal, render, unmountComponentAtNode } from 'react-dom';
import ReactTooltip from 'react-tooltip';
import showdown from 'showdown';
import { browser } from 'webextension-polyfill-ts';

import { CreateIssueModal, CreateIssueModalState } from './components/create-issue-modal/CreateIssueModal';
import { ReplyWidget } from './components/reply-widget/ReplyWidget';
import { getModInfo, setModInfo } from './utils/storage';
import { ACTIONS, ERRORS, IIssue, IMod, Message } from './utils/types';
import { createIssueText, extractTitle, toastDanger, toastInfo } from './utils/utils';

showdown.setFlavor("github");
export const markdown = new showdown.Converter();

// get css together
const MAX_CHARACTERS = 1000;

let commentContainer: HTMLDivElement;
let commentTextarea: HTMLTextAreaElement;
let modalContainer: HTMLDivElement;
let tooltipContainer: HTMLDivElement;
const tooltipElement = (
    <ReactTooltip
        id="reply"
        clickable={true}
        event="click"
        isCapture={true}
        effect="solid"
        type="light"
        place="right"
        className="workshop-toolbox tooltip"
        afterHide={ReactTooltip.rebuild}
        getContent={(content) => {
            if (content) {
                const { author, text } = JSON.parse(content);
                return (
                    <ReplyWidget
                        {...{ author, text, mod }}
                        onSubmit={replyHandler}
                    />
                );
            } else {
                return false;
            }
        }}
    />
);
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

    // respond to changes in the comment container
    new MutationObserver(createButtons).observe(commentContainer, {
        childList: true,
    });

    // first run
    createButtons();

    // add container for modals
    modalContainer = document.createElement("div");
    document.body.append(modalContainer);

    // add tooltip container
    tooltipContainer = document.createElement("div");
    document.body.append(tooltipContainer);
    render(tooltipElement, tooltipContainer);

    // add characterCounters
    // there are two textareas, for public and private comments
    for (const entrybox of document.querySelectorAll<HTMLDivElement>(
        "div.commentthread_entry_quotebox"
    )) {
        addCharacterCounter(entrybox);
    }
}

function createButtons() {
    const comments = document.getElementsByClassName("commentthread_comment");
    for (const comment of comments) {
        const author = comment
            .getElementsByClassName("commentthread_author_link")
            .item(0)!
            .textContent!.trim();
        const html = comment
            .getElementsByClassName("commentthread_comment_text")
            .item(0)!
            .innerHTML.trim();
        const actions = comment
            .getElementsByClassName("commentthread_comment_actions")
            .item(0)!;

        actions.insertAdjacentElement(
            "afterbegin",
            createIssueButton(author, html)
        );

        actions.insertAdjacentElement("afterbegin", createReplyButton(author));
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
            } else {
                message = {
                    action: ACTIONS.ADD_ISSUE_COMMENT,
                    mod,
                    issue,
                    target,
                };
            }
            await new Promise((resolve) =>
                browser.runtime.sendMessage(message, resolve)
            );
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
function createReplyButton(author: string) {
    const button = document.createElement("a");
    button.classList.add("actionlink");
    button.dataset.tooltipText = "Reply";
    button.dataset.tip = JSON.stringify({ author, text: "" });
    button.dataset.for = "reply";
    button.dataset.event = "click";
    button.innerHTML = `<img src="${browser.runtime.getURL(
        "icons/reply.png"
    )}" />`;
    return button;
}

async function replyHandler(
    user: string,
    text: string,
    focus: boolean = false
): Promise<void> {
    if (commentTextarea.value && !commentTextarea.value.endsWith("\n"))
        commentTextarea.value += "\n";
    commentTextarea.value += `[b]@${user}:[/b] ${text}`;
    commentTextarea.blur();
    if (focus) {
        commentTextarea.focus();
    }
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
