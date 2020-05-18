browser.contextMenus.create({
    id: "detach-tabs-to-the-right",
    title: browser.i18n.getMessage("detach-to-the-right"),
    contexts: ["tab"],
    onclick: detach_tabs_to_the_right
});

browser.contextMenus.create({
    id: "detach-tabs-same-origin",
    title: browser.i18n.getMessage("detach-same-origin"),
    contexts: ["tab"],
    onclick: detach_tabs_same_origin
});

browser.contextMenus.create({
    id: "detach-tabs-same-origin-across-windows",
    title: browser.i18n.getMessage("detach-same-origin-across-windows"),
    contexts: ["tab"],
    onclick: detach_tabs_same_origin_across_windows
});

function byIndex(a, b) {
    return a.index - b.index;
}

async function detach_tabs(tabs) {
    console.debug(`detach_tabs: moving ${tabs.length} tab${tabs.length > 1 ? 's' : ''}`);
    const tab1 = tabs.shift();
    const window = await browser.windows.create({ tabId: tab1.id });
    await browser.tabs.move(tabs.map(t => t.id), { windowId: window.id, index: 1 });
}

async function detach_tabs_to_the_right(_, tab) {
    // If there aren't tabs to our left, we've got nothing to do
    if (tab.index == 0) {
        console.debug("detach_tabs_to_the_right: not moving all tabs");
        return;
    }
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    await detach_tabs(current_tabs.sort(byIndex).slice(tab.index));
}

async function detach_tabs_same_origin(_, tab) {
    const url = new URL(tab.url);
    const tab_origin = `${url.origin}/*`;
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    const origin_tabs = await browser.tabs.query({ currentWindow: true, url: tab_origin });
    // If the current window is already tabs from the same origin, we've got nothing to do
    if (current_tabs.length == origin_tabs.length) {
        console.debug("detach_tabs_same_origin: not moving all tabs");
        return;
    }
    await detach_tabs(origin_tabs.sort(byIndex));
}

async function detach_tabs_same_origin_across_windows(_, tab) {
    const url = new URL(tab.url);
    const tab_origin = `${url.origin}/*`;
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    const origin_tabs = await browser.tabs.query({ url: tab_origin });
    // If all the same-origin tabs are already here, we've got nothing to do
    if (origin_tabs.every(t => t.windowId == tab.windowId)) {
        console.debug("detach_tabs_same_origin_across_windows: not moving all tabs");
        return;
    }
    await detach_tabs(origin_tabs.sort(byIndex));
}
