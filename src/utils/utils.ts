import chroma, { rgb } from "chroma-js";

import { Status } from "./types";

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

export const statusColors: Record<Status, string> = {
    info: "#4fc3f7",
    success: "#7ac74f",
    danger: "#f24236",
    warning: "#ffe74c",
};

export function textColour(color: chroma.Color) {
    const white = chroma("#fff");
    if (chroma.contrast(white, color) >= 2) {
        return white;
    } else {
        return rgb(45, 45, 45);
    }
}
