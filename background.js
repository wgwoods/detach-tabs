/* Make context menu items */
browser.menus.create({
    id: "pop-this-tab",
    title: browser.i18n.getMessage("pop-this-tab"),
    contexts: ["tab"],
    onclick: async (info, tab) => { pop_this_tab(tab) }
});

browser.menus.create({
    id: "pop-tabs-to-the-right",
    title: browser.i18n.getMessage("pop-tabs-to-the-right"),
    contexts: ["tab"],
    onclick: async (info, tab) => { pop_tabs_to_the_right(tab) }
});

/* Disable menu items when they aren't valid */
browser.menus.onShown.addListener(async (info, tab) => {
    // TODO: do we need to check for hidden tabs?
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    browser.menus.update("pop-this-tab",          { enabled: (current_tabs.length > 1) });
    browser.menus.update("pop-tabs-to-the-right", { enabled: (tab.index > 0) });
    browser.menus.refresh();
});

/* Key command listener is defined in manifest.json */
browser.commands.onCommand.addListener(async (command) => {
    const active_tabs = await browser.tabs.query({ currentWindow: true, active: true });
    const tab = active_tabs[0];
    if (command === "pop-this-tab") {
        pop_this_tab(tab);
    } else if (command === "pop-tabs-to-the-right") {
        pop_tabs_to_the_right(tab);
    } else {
        console.error(`poptabs: unknown command '${command}'`);
    }
});

/* Sorting helper */
function byIndex(a, b) { return a.index - b.index; }

/* Actually move the given array of tabs to a new window */
async function _pop_tabs(tabs) {
    console.debug(`_pop_tabs: moving ${tabs.length} tab${tabs.length > 1 ? 's' : ''}`);
    const tab1 = tabs.shift();
    const window = await browser.windows.create({ tabId: tab1.id });
    await browser.tabs.move(tabs.map(t => t.id), { windowId: window.id, index: 1 });
}

async function pop_this_tab(tab) {
    // If this is the only tab, there's nothing to do
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    if (current_tabs.length == 1) {
        console.debug("pop_this_tab: this is the only tab; not moving");
        return;
    }
    await _pop_tabs([tab]);
}

async function pop_tabs_to_the_right(tab) {
    // If there aren't tabs to our left, we've got nothing to do
    if (tab.index == 0) {
        console.debug("pop_tabs_to_the_right: not moving all tabs");
        return;
    }
    const current_tabs = await browser.tabs.query({ currentWindow: true });
    await _pop_tabs(current_tabs.sort(byIndex).slice(tab.index));
}

