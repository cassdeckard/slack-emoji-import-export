// ==UserScript==
// @name         Slack emoji import/export
// @namespace    http://mattdeckard.github.io
// @version      0.1
// @description  Save and restore custom emoji from your Slack workspaces
// @author       Matt Deckard <matthew.d.deckard@gmail.com>
// @match        https://*.slack.com/customize/emoji
// @match        https://*.slack.com/customize/emoji?*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      emoji.slack-edge.com
// ==/UserScript==
//debugger;

(function() {
    'use strict';

    function addEmojiRows(teamName) {
        var emojiList = savedEmoji[teamName] || {};
        var thead = '<thead id="emoji-team-' + teamName + '" hidden>';
        Object.keys(emojiList).forEach(function(emojiName) {
            var emojiUrl = emojiList[emojiName];
            var importId = 'emoji-import-' + emojiName;
            var tr = '';
            tr += '<tr class="emoji_row">';
            tr += '    <td headers="custom_emoji_image" class="align_middle"><span data-original="'+ emojiUrl +'" class="lazy emoji-wrapper" style="background-color: transparent;"></span></td>';
            tr += '    <td headers="custom_emoji_name" class="align_middle custom_emoji_name" style="">:'+ emojiName +':</td>';
            if ($('[headers*="custom_emoji_name"]:contains(:' + emojiName + ':)')[0] === undefined) {
                tr += '    <td headers="custom_emoji_type" class="align_middle"><a  class="display_flex align_items_center break_word bold" id="' + importId + '">Import</a></td>';
            } else {
                tr += '    <td headers="custom_emoji_type" class="align_middle">(name already used)</td>';
            }
            tr += '    <td headers="custom_emoji_author" class="author_cell hide_on_mobile" style="white-space: normal;"></td>';
            tr += '    <td headers="custom_emoji_remove" class="align_middle align_right bold"></td>';
            tr += '</tr>';
            thead += tr;
            $('body').on('click', '#' + importId, function(event) { importEmoji(emojiName, emojiUrl); });
        });
        thead +='</thead>';
        $('#custom_emoji tbody').before(thead);
    }

    function hideAllEmojiSectionsExcept(exception, allTeams) {
       allTeams.forEach( function(teamName) {
          if (teamName == exception) {
             $('#emoji-team-' + teamName).prop('hidden', false);
          } else {
             $('#emoji-team-' + teamName).prop('hidden', true);
          }
       });
    }

    function importEmoji(name, url) {
        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            responseType: "arraybuffer",
            headers: {},
            onload: function(event) {
                // Obtain a blob: URL for the image data.
                var blob = new Blob([event.response], { type: "image/jpeg" } );
                var file = new File([blob], name + '.jpg');
                const dT = new ClipboardEvent('').clipboardData || // Firefox bug?
                      new DataTransfer();                          // specs compliant
                dT.items.add(file);
                $('#emojiname').val(name);
                $('#emojiimg')[0].files = dT.files;
                $('#addemoji').submit();
            }
        });
    }

    const STORED_DATA_KEY = 'emoji-import-export';
    var currentTeamName = window.location.hostname.split('.')[0];
    var custom_emoji = document.evaluate('//*[@id="custom_emoji"]/tbody/tr[@class="emoji_row"]/td/span/@data-original',
                                         document, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var savedEmoji = JSON.parse(GM_getValue(STORED_DATA_KEY, '{}'));
    console.log(savedEmoji);
    var newEmoji = {};
    for (emoji = custom_emoji.iterateNext(); emoji; emoji = custom_emoji.iterateNext()) {
        var name = emoji.value.split('/')[4];
        //console.dir(name);
        newEmoji[name] = emoji.value;
        emoji = custom_emoji.iterateNext();
    }
    savedEmoji[currentTeamName] = newEmoji;
    console.log(savedEmoji);
    GM_setValue(STORED_DATA_KEY, JSON.stringify(savedEmoji));

    var html = '<div>Import from: ';
    var allTeams = Object.keys(savedEmoji);
    allTeams.forEach(function(teamName) {
        var isCurrentTeam = (teamName == currentTeamName);
        var disabled = isCurrentTeam ? ' disabled ' : ' ';
        var buttonId = STORED_DATA_KEY + '-btn-' + teamName;
        html += '<input type="button" class="btn"' + disabled + 'style="margin-left: 1.5rem;" value="' + teamName + '" id="' + buttonId + '">';
        if (!isCurrentTeam) {
           addEmojiRows(teamName);
        }
        $('body').on('click', '#' + buttonId, function(event) { hideAllEmojiSectionsExcept(teamName, allTeams); });
    });
    html += '</div>';
    $('#custom_emoji').before(html);
})();
