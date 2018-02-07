// ==UserScript==
// @name         Slack emoji import/export
// @namespace    http://mattdeckard.github.io
// @version      0.1
// @description  Save and restore custom emoji from your Slack workspaces
// @author       Matt Deckard <matthew.d.deckard@gmail.com>
// @match        https://*.slack.com/customize/emoji
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const STORED_DATA_KEY = 'emoji-import-export';
    var subdomain = window.location.hostname.split('.')[0];
    var custom_emoji = document.evaluate('//*[@id="custom_emoji"]/tbody/tr[@class="emoji_row"]/td/span/@data-original',
                                         document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var savedEmoji = JSON.parse(GM_getValue(STORED_DATA_KEY)) || {};
    console.log(savedEmoji);
    var newEmoji = {};
    for (emoji = custom_emoji.iterateNext(); emoji; emoji = custom_emoji.iterateNext()) {
        var name = emoji.value.split('/')[4];
        //console.dir(name);
        newEmoji[name] = emoji.value;
        emoji = custom_emoji.iterateNext();
    }
    savedEmoji[subdomain] = newEmoji;
    console.log(savedEmoji);
    GM_setValue(STORED_DATA_KEY, JSON.stringify(savedEmoji));
})();
