import Handlebars from 'handlebars';

import { IQuickReply } from './types';

interface QuickReplyData {
    mod: string;
    author: string;
    repo: string;
}

export function renderQuickReply(
    quickReply: IQuickReply,
    data: Partial<QuickReplyData>
): Handlebars.Template {
    const template = Handlebars.compile(quickReply.content);
    return template(data);
}
