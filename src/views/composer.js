import { Frag, T, h, useRef, useState } from '../core/globals.js';
import { messagePreview } from '../core/message-content.js';
import { shownName } from '../core/selectors.js';
import { useApp } from '../core/ui.js';
import { uploadKey, useAttachMedia } from './attach.js';
import { runCommand } from './commands.js';
import { useEmojiPicker } from './emoji-picker.js';
import { useMediaCompletion } from './media.js';
import { MessageStyleButton } from './message-style.js';
import { quoteOf } from './message.js';
import { attachMenu, useVoiceRecorder } from './voice.js';
// -- Conversation composer ----------------------------------------------------
// BetterChatango rejects the tenth edit of a message.
export var EDIT_MAX = 9;
var COMPOSER_MODES = {
  // BetterChatango renders replies and edits too (inject.js:5407, 5514), other Chatango apps show a new message.
  reply: { icon: 'reply', verb: 'Replying to', cancelLabel: 'Cancel reply', note: 'Only people on Nightango or BetterChatango see this.' },
  edit: { icon: 'edit', verb: 'Editing', cancelLabel: 'Cancel edit', note: 'Only people on Nightango or BetterChatango see this.' },
  quote: { icon: 'quote', verb: 'Quoting', cancelLabel: 'Cancel quote' }
};
/**
 * Reply, edit or quote mode of a composer.
 * During an edit, the draft holds the edited text and the typed draft waits aside.
 * @param {Array} draft useDraft result of the composer.
 * @returns {{mode: ?{kind: string, m: Object}, setMode: Function, close: Function, enter: function(string): Function, edit: function(Object, number)}} Mode and its transitions.
 */
export function useComposerMode(draft) {
  var app = useApp();
  var st = useState(null), mode = st[0], setMode = st[1], stash = useRef('');
  if (mode && mode.kind === 'edit') draft[2].current = stash.current;
  function close() { if (mode && mode.kind === 'edit') draft[1](stash.current); setMode(null); }
  return {
    mode: mode, setMode: setMode, close: close,
    enter: function (kind) { return function (m) { close(); setMode({ kind: kind, m: m }); }; },
    edit: function (m, edits) {
      if (edits >= EDIT_MAX) { app.ui.toast("You can't edit this message again. BetterChatango allows " + EDIT_MAX + ' edits per message.'); return; }
      if (!mode || mode.kind !== 'edit') stash.current = draft[0];
      draft[1](m.text);
      setMode({ kind: 'edit', m: m });
    }
  };
}
/**
 * Tells whether a key pressed in a composer opens the edit of the user's last message.
 * @param {KeyboardEvent} e Key pressed in the composer field.
 * @param {string} draft Composer text.
 * @param {?Object} mode Reply, edit or quote mode of the composer.
 */
function editsLastOnUp(e, draft, mode) {
  return e.key === 'ArrowUp' && !draft && !mode && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey;
}

/**
 * Composer of a group or a private conversation, with its reply, edit or quote, emoticon and media picker, :name completion, file upload and voice message.
 * A message goes out as an edit, else as a command, else with the picked file, else as text. A refused message comes back to the field.
 * @param {{target: {kind: string, id: string}, draft: Array, cm: Object, inputRef: Object, placeholder: string, replyTo: function(Object): Object, opts: ?Object,
 *   send: function(string, Object): boolean, edit: function(Object, string): boolean, editLast: function(): boolean, onSending: ?Function,
 *   completion: ?{onChange: Function, onKeyDown: Function, panel: Object}, canSend: ?boolean, hint: *, hintTone: ?string, aside: *}} p Conversation (uploadKey),
 *   draft (useDraft), mode (useComposerMode), field, placeholder, reference to the replied message, options sent with every message, text and edit sending,
 *   edit of the user's last message (false if none can be edited), called before a message leaves, extra completion of the field, and what the Composer shows.
 */
export function ConversationComposer(p) {
  var app = useApp(), cm = p.cm, mode = cm.mode, kind = mode && mode.kind, editing = kind === 'edit';
  var draft = p.draft[0], setDraft = p.draft[1], completion = p.completion;
  var emoji = useEmojiPicker(p.inputRef, setDraft), media = useMediaCompletion(draft, setDraft);
  var attach = useAttachMedia(p.target, setDraft);
  var voice = useVoiceRecorder(uploadKey(p.target), attach.onFiles);
  function onKeyDown(e) {
    media.onKeyDown(e);
    if (completion && !e.defaultPrevented) completion.onKeyDown(e);
    if (editsLastOnUp(e, draft, mode) && p.editLast()) e.preventDefault();
  }
  function send(text) {
    if (editing) {
      if (text !== mode.m.text && !p.edit(mode.m, text)) { setDraft(text); return; }
      cm.close();
      return;
    }
    if (runCommand(app, text, p.target.kind === 'group' ? p.target.id : null)) return;
    if (p.onSending) p.onSending();
    var opts = Object.assign({
      replyTo: kind === 'reply' ? p.replyTo(mode.m) : null,
      quote: kind === 'quote' ? quoteOf(shownName(app.state, mode.m.author), mode.m.text) : null
    }, p.opts), sentMode = mode;
    // The upload ends later: a mode opened meanwhile stays.
    if (attach.file) { attach.send(text, opts, function () { cm.setMode(function (cur) { return cur === sentMode ? null : cur; }); }); return; }
    if (!p.send(text, opts)) { setDraft(text); return; }
    cm.setMode(null);
  }
  return h(Frag, null, media.panel, completion ? completion.panel : null, voice.panel, h(T.Composer, {
    placeholder: p.placeholder, value: draft, onChange: completion ? completion.onChange : setDraft, onKeyDown: onKeyDown, inputRef: p.inputRef,
    canSend: p.canSend !== false && (editing || !attach.busy), hint: p.hint, hintTone: p.hintTone,
    context: mode ? Object.assign({ author: shownName(app.state, mode.m.author), text: messagePreview(mode.m) }, COMPOSER_MODES[kind]) : null,
    onCancelContext: cm.close, onSend: send, onEmoji: emoji.onEmoji, status: attach.status,
    // An edit changes only the text: the picked file waits for the next message.
    onAttach: editing ? null : attach.onAttach, onFiles: editing ? null : attach.onFiles, attachment: editing ? null : attach.attachment,
    attachMenu: editing ? null : attachMenu(attach, voice),
    beforeSend: h(MessageStyleButton, null), aside: p.aside
  }), emoji.picker, attach.input);
}
