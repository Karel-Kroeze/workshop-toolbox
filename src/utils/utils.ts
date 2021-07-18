import chroma, { hsl, rgb } from 'chroma-js';
import Toastify from 'toastify-js';

import { IStatusUpdate } from './types';

export function extractTitle(body: string): string {
    return body.split("\n")[0];
}

export function createIssueText({
    body,
    author,
    source,
}: {
    body: string;
    author: string;
    source?: string;
}): string {
    let text: string = `**reported by:**  \n${author}\n\n`;
    if (source) text += `**source:**  \n${source}\n\n`;
    text += `**description:**  \n${body
        .split("\n")
        .map((l) => "> " + l)
        .join("\n")}`;
    return text;
}

export function toast({ status, message, link, onClick }: IStatusUpdate) {
    let color: string;
    switch (status) {
        case "success":
            color = hsl(141, 0.53, 0.53).hex();
            break;
        case "danger":
            color = hsl(348, 0.86, 0.61).hex();
            break;
        case "warning":
            color = hsl(44, 1, 0.77).hex();
            break;
        default:
            color = hsl(204, 0.86, 0.53).hex();
    }
    doToast(message, color, link, onClick);
}

export function toastInfo(message: string, link?: string, onClick?: Function) {
    toast({ status: "info", message, link, onClick });
}

export function toastSuccess(
    message: string,
    link?: string,
    onClick?: Function
) {
    toast({ status: "success", message, link, onClick });
}

export function toastWarning(
    message: string,
    link?: string,
    onClick?: Function
) {
    toast({ status: "warning", message, link, onClick });
}

export function toastDanger(
    message: string,
    link?: string,
    onClick?: Function
) {
    toast({ status: "danger", message, link, onClick });
}

function doToast(
    message: string,
    color: string,
    link?: string,
    onClick?: Function
) {
    console.log({ message, color });
    Toastify({
        text: message,
        duration: 3000,
        destination: link,
        newWindow: true,
        close: true,
        gravity: "bottom", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        background: color,
        stopOnFocus: true, // Prevents dismissing of toast on hover
        onClick,
    }).showToast();
}

export function textColour(color: chroma.Color) {
    const white = chroma("#fff");
    if (chroma.contrast(white, color) >= 2) {
        return white;
    } else {
        return rgb(45, 45, 45);
    }
}
