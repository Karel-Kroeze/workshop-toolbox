import { browser } from 'webextension-polyfill-ts';

import { IGithubUser, IMod, IQuickReply } from './types';

export async function getModInfo(id: number): Promise<IMod | undefined> {
    const key = `mod.${id}`;
    const data = await browser.storage.sync.get(key);
    const modData = data[key];
    if (modData) {
        return JSON.parse(modData) as IMod;
    }
}

export async function setModInfo(mod: IMod): Promise<void> {
    const key = `mod.${mod.publishedFileId}`;
    await browser.storage.sync.set({ [key]: JSON.stringify(mod) });
}

export async function clearModInfo(mod: IMod): Promise<void> {
    const key = `mod.${mod.publishedFileId}`;
    await browser.storage.sync.remove(key);
}

export async function getAllModInfo(): Promise<IMod[]> {
    const data = await browser.storage.sync.get();
    return Object.entries(data)
        .filter(([key]) => key.startsWith("mod."))
        .map(([_, datum]) => JSON.parse(datum));
}

export async function getGithubUser(): Promise<IGithubUser | undefined> {
    const { user } = await browser.storage.sync.get("user");
    if (user) {
        console.log({ user });
        return JSON.parse(user);
    }
}

export async function setGitHubUser(user: IGithubUser): Promise<void> {
    await browser.storage.sync.set({ user: JSON.stringify(user) });
}

export async function clearGitHubUser(): Promise<void> {
    await browser.storage.sync.remove("user");
}

// get all quick replies from storage
export async function getQuickReplies(): Promise<IQuickReply[]> {
    const data = await browser.storage.sync.get();
    return Object.entries(data)
        .filter(([key]) => key.startsWith("quickReply."))
        .map(([_, value]) => JSON.parse(value));
}

// store quick reply
export async function setQuickReply(quickReply: IQuickReply): Promise<void> {
    const key = `quickReply.${quickReply.label}`;
    await browser.storage.sync.set({ [key]: JSON.stringify(quickReply) });
}

// delete quick reply from storage
export async function deleteQuickReply(quickReply: IQuickReply): Promise<void> {
    const key = `quickReply.${quickReply.label}`;
    await browser.storage.sync.remove(key);
}
