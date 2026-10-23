/* @ds-bundle: {"format":4,"namespace":"Torch","components":[{"name":"Icon"},{"name":"Button"},{"name":"IconButton"},{"name":"TextField"},{"name":"Switch"},{"name":"Checkbox"},{"name":"SegmentedControl"},{"name":"Badge"},{"name":"CountBadge"},{"name":"Avatar"},{"name":"NavItem"},{"name":"Message"},{"name":"DayDivider"},{"name":"Banner"},{"name":"SettingsSection"},{"name":"SettingRow"},{"name":"SaveBar"},{"name":"Composer"},{"name":"Skeleton"},{"name":"Spinner"}]} */
(function () {
  'use strict';
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    return out;
  }

  var ICONS = {
    search: [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.3-4.3' }]],
    plus: [['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]],
    send: [['path', { d: 'm22 2-7 20-4-9-9-4Z' }], ['path', { d: 'M22 2 11 13' }]],
    reply: [['polyline', { points: '9 17 4 12 9 7' }], ['path', { d: 'M20 18v-2a4 4 0 0 0-4-4H4' }]],
    smile: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M8 14s1.5 2 4 2 4-2 4-2' }], ['line', { x1: 9, x2: 9.01, y1: 9, y2: 9 }], ['line', { x1: 15, x2: 15.01, y1: 9, y2: 9 }]],
    hash: [['line', { x1: 4, x2: 20, y1: 9, y2: 9 }], ['line', { x1: 4, x2: 20, y1: 15, y2: 15 }], ['line', { x1: 10, x2: 8, y1: 3, y2: 21 }], ['line', { x1: 16, x2: 14, y1: 3, y2: 21 }]],
    users: [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }]],
    'user-plus': [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M19 8v6' }], ['path', { d: 'M22 11h-6' }]],
    'user-minus': [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M22 11h-6' }]],
    bell: [['path', { d: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9' }], ['path', { d: 'M10.3 21a1.94 1.94 0 0 0 3.4 0' }]],
    more: [['circle', { cx: 12, cy: 12, r: 1 }], ['circle', { cx: 19, cy: 12, r: 1 }], ['circle', { cx: 5, cy: 12, r: 1 }]],
    pin: [['line', { x1: 12, x2: 12, y1: 17, y2: 22 }], ['path', { d: 'M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z' }]],
    lock: [['rect', { width: 18, height: 11, x: 3, y: 11, rx: 2, ry: 2 }], ['path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' }]],
    check: [['path', { d: 'M20 6 9 17l-5-5' }]],
    x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
    'chevron-down': [['path', { d: 'm6 9 6 6 6-6' }]],
    'chevron-right': [['path', { d: 'm9 18 6-6-6-6' }]],
    'chevron-left': [['path', { d: 'm15 18-6-6 6-6' }]],
    'arrow-left': [['path', { d: 'm12 19-7-7 7-7' }], ['path', { d: 'M19 12H5' }]],
    sliders: [['line', { x1: 4, x2: 4, y1: 21, y2: 14 }], ['line', { x1: 4, x2: 4, y1: 10, y2: 3 }], ['line', { x1: 12, x2: 12, y1: 21, y2: 12 }], ['line', { x1: 12, x2: 12, y1: 8, y2: 3 }], ['line', { x1: 20, x2: 20, y1: 21, y2: 16 }], ['line', { x1: 20, x2: 20, y1: 12, y2: 3 }], ['line', { x1: 2, x2: 6, y1: 14, y2: 14 }], ['line', { x1: 10, x2: 14, y1: 8, y2: 8 }], ['line', { x1: 18, x2: 22, y1: 16, y2: 16 }]],
    message: [['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }]],
    compass: [['circle', { cx: 12, cy: 12, r: 10 }], ['polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' }]],
    flame: [['path', { d: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z' }]],
    shield: [['path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10' }]],
    crown: [['path', { d: 'm2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14' }]],
    image: [['rect', { width: 18, height: 18, x: 3, y: 3, rx: 2 }], ['circle', { cx: 9, cy: 9, r: 2 }], ['path', { d: 'm21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21' }]],
    play: [['polygon', { points: '6 3 20 12 6 21 6 3' }]],
    'rotate-cw': [['path', { d: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8' }], ['path', { d: 'M21 3v5h-5' }]],
    paperclip: [['path', { d: 'm21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48' }]],
    bold: [['path', { d: 'M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8' }]],
    italic: [['line', { x1: 19, x2: 10, y1: 4, y2: 4 }], ['line', { x1: 14, x2: 5, y1: 20, y2: 20 }], ['line', { x1: 15, x2: 9, y1: 4, y2: 20 }]],
    link: [['path', { d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71' }], ['path', { d: 'M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' }]],
    upload: [['path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }], ['polyline', { points: '17 8 12 3 7 8' }], ['line', { x1: 12, x2: 12, y1: 3, y2: 15 }]],
    trash: [['path', { d: 'M3 6h18' }], ['path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6' }], ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }]],
    volume: [['polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }], ['path', { d: 'M15.54 8.46a5 5 0 0 1 0 7.07' }]],
    'volume-x': [['polygon', { points: '11 5 6 9 2 9 2 15 6 15 11 19 11 5' }], ['line', { x1: 22, x2: 16, y1: 9, y2: 15 }], ['line', { x1: 16, x2: 22, y1: 9, y2: 15 }]],
    globe: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20' }], ['path', { d: 'M2 12h20' }]],
    'log-out': [['path', { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' }], ['polyline', { points: '16 17 21 12 16 7' }], ['line', { x1: 21, x2: 9, y1: 12, y2: 12 }]],
    edit: [['path', { d: 'M12 20h9' }], ['path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' }]],
    info: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 16v-4' }], ['path', { d: 'M12 8h.01' }]],
    alert: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 8v4' }], ['path', { d: 'M12 16h.01' }]],
    ban: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'm4.9 4.9 14.2 14.2' }]],
    'eye-off': [['path', { d: 'M9.88 9.88a3 3 0 1 0 4.24 4.24' }], ['path', { d: 'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68' }], ['path', { d: 'M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61' }], ['line', { x1: 2, x2: 22, y1: 2, y2: 22 }]],
    external: [['path', { d: 'M15 3h6v6' }], ['path', { d: 'M10 14 21 3' }], ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]],
    panel: [['rect', { width: 18, height: 18, x: 3, y: 3, rx: 2 }], ['path', { d: 'M15 3v18' }]],
    menu: [['line', { x1: 4, x2: 20, y1: 12, y2: 12 }], ['line', { x1: 4, x2: 20, y1: 6, y2: 6 }], ['line', { x1: 4, x2: 20, y1: 18, y2: 18 }]],
    star: [['polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }]],
    gift: [['rect', { x: 3, y: 8, width: 18, height: 4, rx: 1 }], ['path', { d: 'M12 8v13' }], ['path', { d: 'M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7' }], ['path', { d: 'M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5' }]],
    type: [['polyline', { points: '4 7 4 4 20 4 20 7' }], ['line', { x1: 9, x2: 15, y1: 20, y2: 20 }], ['line', { x1: 12, x2: 12, y1: 4, y2: 20 }]],
    list: [['line', { x1: 8, x2: 21, y1: 6, y2: 6 }], ['line', { x1: 8, x2: 21, y1: 12, y2: 12 }], ['line', { x1: 8, x2: 21, y1: 18, y2: 18 }], ['line', { x1: 3, x2: 3.01, y1: 6, y2: 6 }], ['line', { x1: 3, x2: 3.01, y1: 12, y2: 12 }], ['line', { x1: 3, x2: 3.01, y1: 18, y2: 18 }]]
  };

  function Icon(props) {
    var parts = ICONS[props.name] || ICONS.info;
    var size = props.size || 16;
    var label = props.label;
    return h('svg', {
      className: cx('tc-icon', props.className), width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: props.strokeWidth || 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': label ? undefined : 'true', role: label ? 'img' : undefined, 'aria-label': label, style: props.style
    }, parts.map(function (p, i) { return h(p[0], Object.assign({ key: i }, p[1])); }));
  }

  function Button(props) {
    var variant = props.variant || 'secondary';
    var size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'block', 'icon', 'iconRight', 'children', 'className', 'type']);
    return h('button', Object.assign({ type: props.type || 'button', className: cx('tc-btn', 'tc-btn-' + variant, size !== 'md' && 'tc-btn-' + size, props.block && 'tc-btn-block', props.className) }, rest),
      props.icon ? h(Icon, { name: props.icon, size: size === 'sm' ? 14 : 15 }) : null,
      props.children,
      props.iconRight ? h(Icon, { name: props.iconRight, size: 14 }) : null);
  }

  function IconButton(props) {
    var size = props.size || 32;
    var rest = omit(props, ['icon', 'label', 'size', 'iconSize', 'pressed', 'className', 'style']);
    return h('button', Object.assign({
      type: 'button', className: cx('tc-ib', props.className), 'aria-label': props.label, title: props.label,
      'aria-pressed': props.pressed == null ? undefined : String(!!props.pressed),
      style: Object.assign({ width: size, height: size }, props.style)
    }, rest), h(Icon, { name: props.icon, size: props.iconSize || (size >= 32 ? 17 : 15) }));
  }

  function TextField(props) {
    var autoId = React.useId();
    var id = props.id || autoId;
    var hintId = id + '-hint';
    var rest = omit(props, ['label', 'hint', 'error', 'multiline', 'id', 'className', 'labelAside']);
    var describedBy = props.error || props.hint ? hintId : undefined;
    var control = h(props.multiline ? 'textarea' : 'input', Object.assign({
      id: id, className: cx('tc-input', props.className), 'aria-invalid': props.error ? 'true' : undefined, 'aria-describedby': describedBy
    }, props.multiline ? { rows: props.rows || 4 } : { type: props.type || 'text' }, rest));
    return h('div', { className: 'tc-field' },
      props.label ? h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 } },
        h('label', { className: 'tc-label', htmlFor: id }, props.label), props.labelAside || null) : null,
      control,
      props.error ? h('span', { id: hintId, className: 'tc-error' }, props.error) : props.hint ? h('span', { id: hintId, className: 'tc-hint' }, props.hint) : null);
  }

  function Switch(props) {
    var rest = omit(props, ['label', 'className']);
    return h('input', Object.assign({ type: 'checkbox', role: 'switch', className: cx('tc-switch', props.className), 'aria-label': props.label }, rest));
  }

  function Checkbox(props) {
    var rest = omit(props, ['label', 'className', 'ariaLabel']);
    var input = h('input', Object.assign({ type: 'checkbox', className: cx('tc-check', props.className), 'aria-label': props.ariaLabel }, rest));
    if (!props.label) return input;
    return h('label', { className: 'tc-checkline' }, input, h('span', null, props.label));
  }

  function SegmentedControl(props) {
    return h('div', { role: 'group', 'aria-label': props.label, className: cx('tc-seg', props.block && 'tc-seg-block', props.className) },
      props.options.map(function (o) {
        var value = typeof o === 'string' ? o : o.value;
        var text = typeof o === 'string' ? o : o.label;
        return h('button', {
          key: value, type: 'button', 'aria-pressed': String(value === props.value),
          onClick: function () { if (props.onChange) props.onChange(value); }
        }, text);
      }));
  }

  function Badge(props) {
    return h('span', { className: cx('tc-badge', props.tone === 'accent' && 'tc-badge-accent', props.className) },
      props.icon ? h(Icon, { name: props.icon, size: 11, strokeWidth: 2.4 }) : null, props.children);
  }

  function CountBadge(props) {
    if (!props.count) return null;
    var text = props.mention ? '@' + props.count : String(props.count > 99 ? '99+' : props.count);
    var label = props.count + (props.mention ? (props.count > 1 ? ' mentions' : ' mention') : ' unread');
    return h('span', { className: 'tc-count', 'aria-label': label }, text);
  }

  var AVATAR_COLORS = ['#3e5a6b', '#2f5d50', '#5d3e3e', '#6b4a2f', '#5a3e5d', '#3b4a6b', '#4a4f5a', '#2f4b5d'];
  function avatarColor(name) {
    var s = String(name || '');
    var n = 0;
    for (var i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[n % AVATAR_COLORS.length];
  }
  function initials(name) {
    var s = String(name || '?').replace(/[^A-Za-z0-9]/g, '');
    return (s.slice(0, 2) || '?').toUpperCase();
  }

  // Images en échec mémorisées pour toute la page : un compte sans photo n'est demandé qu'une fois.
  var brokenAvatars = Object.create(null);
  // Images déjà chargées : affichées sans fondu au montage suivant.
  var loadedAvatars = Object.create(null);

  function Avatar(props) {
    var size = props.size || 36;
    var dot = Math.max(8, Math.round(size * 0.3));
    var failed = React.useState(0)[1];
    var fade = React.useState(null), fadedSrc = fade[0], setFadedSrc = fade[1];
    var src = props.src && !brokenAvatars[props.src] ? props.src : null;
    var style = Object.assign({ width: size, height: size, background: props.color || avatarColor(props.name), fontSize: Math.round(size * (props.square ? 0.45 : 0.36)) }, props.ring ? { '--presence-ring': props.ring } : null, props.style);
    return h('span', { className: cx('tc-avatar', props.square && 'tc-avatar-square'), style: style, 'aria-hidden': 'true' },
      props.square ? String(props.name || '?').charAt(0).toUpperCase() : initials(props.name),
      src ? h('img', { className: cx('tc-avatar-img', fadedSrc === src ? 'tc-fade-in' : !loadedAvatars[src] && 'tc-avatar-img-wait'), src: src, alt: '', loading: 'lazy', decoding: 'async', draggable: false,
        onLoad: function () { loadedAvatars[src] = true; setFadedSrc(src); if (props.onLoad) props.onLoad(); },
        onError: function () { brokenAvatars[src] = true; failed(function (n) { return n + 1; }); } }) : null,
      props.status ? h('span', { className: 'tc-presence tc-presence-' + props.status, style: { width: dot, height: dot } }) : null);
  }

  function NavItem(props) {
    var leading = props.avatar ? props.avatar : props.icon ? h(Icon, { name: props.icon, size: 16 }) : null;
    var trailing = props.trailing != null ? props.trailing
      : props.count ? h(CountBadge, { count: props.count, mention: props.mention })
        : props.unread ? h('span', { className: 'tc-dot', 'aria-label': 'Unread messages' })
          : props.muted ? h(Icon, { name: 'volume-x', size: 14, label: 'Muted' }) : null;
    var cls = cx('tc-nav', !props.active && props.unread && 'tc-nav-unread', !props.active && props.muted && 'tc-nav-muted', props.className);
    var inner = [leading, h('span', { key: 'l', className: 'tc-nav-label' }, props.label), trailing];
    var common = { className: cls, 'aria-current': props.active ? 'page' : undefined, onClick: props.onClick, title: props.title };
    return props.href
      ? h.apply(null, ['a', Object.assign({ href: props.href }, common)].concat(inner))
      : h.apply(null, ['button', Object.assign({ type: 'button' }, common)].concat(inner));
  }

  function renderText(text) {
    return text.split(/(@[A-Za-z0-9_-]+)/g).map(function (p, i) {
      if (p.charAt(0) === '@' && p.length > 1) return h('span', { key: i, className: 'tc-mention' }, p);
      return p;
    });
  }

  function Message(props) {
    var mention = props.mention && 'tc-msg-mention';
    var body = typeof props.children === 'string' ? h('p', { className: 'tc-msg-text' }, renderText(props.children)) : props.children;
    var author = typeof props.author === 'string' ? h('span', { className: 'tc-msg-author' }, props.author) : props.author;
    var time = h('time', { className: 'tc-msg-time' }, props.time);
    var actions = props.actions ? h('div', { className: 'tc-msg-actions' }, props.actions) : null;
    var reply = props.reply ? h('div', { className: 'tc-msg-reply' },
      h(Icon, { name: 'reply', size: 14 }), props.reply.avatar,
      props.reply.author ? h('span', { className: 'tc-msg-reply-author' }, props.reply.author) : null,
      props.reply.onJump
        ? h('button', { type: 'button', className: 'tc-msg-reply-text tc-msg-reply-jump', title: 'Go to the original message', onClick: props.reply.onJump }, props.reply.text)
        : h('span', { className: 'tc-msg-reply-text' }, props.reply.text)) : null;
    // Fond en style inline : il doit passer devant le fond du membre, lui aussi inline.
    var highlight = props.highlight ? { background: 'var(--selected)' } : null;
    var bg = props.background && !highlight ? h('div', { className: 'tc-msg-bg', 'aria-hidden': 'true' }, props.background) : null;
    function row(base, style) { return { className: cx(base, mention, bg && 'tc-msg-layered', props.className), style: Object.assign({}, style, props.style, highlight), 'data-msg-id': props.msgId }; }
    if (props.compact) {
      // Base de 8em : sur un écran étroit, le texte passe à la ligne au lieu de s'écraser à côté du rôle et du canal.
      return h('article', row('cmsg'),
        bg, time, author, props.meta, h('div', { style: { flex: '1 1 8em', minWidth: 0 } }, reply, body), actions);
    }
    if (props.continued) {
      return h('article', row('tc-msg tc-msg-cont'),
        bg, h('span', { className: 'tc-msg-gutter' }, props.time), h('div', { className: 'tc-msg-body' }, body), actions);
    }
    return h('article', row('tc-msg', Object.assign({ marginTop: 6 }, reply ? { flexDirection: 'column' } : null)),
      bg, reply,
      h('div', { style: { display: 'flex', gap: 12, minWidth: 0 } },
        props.avatar,
        h('div', { className: 'tc-msg-body' }, h('div', { className: 'tc-msg-head' }, author, props.meta, time), body)),
      actions);
  }

  function DayDivider(props) {
    return h('div', { className: 'tc-day', role: 'separator' }, props.children);
  }

  function Banner(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('tc-banner', 'tc-banner-' + tone, props.className), role: tone === 'warning' ? 'status' : undefined },
      h('span', { className: 'tc-banner-icon', style: { display: 'inline-flex' } }, h(Icon, { name: props.icon || (tone === 'warning' ? 'alert' : 'pin'), size: 16 })),
      h('span', { className: 'tc-banner-body' },
        props.title ? h('span', { className: 'tc-banner-title' }, props.title) : null,
        h('span', { className: 'tc-banner-text' }, props.children)),
      props.action || null,
      props.onDismiss ? h(IconButton, { icon: 'x', label: 'Dismiss', size: 26, iconSize: 14, onClick: props.onDismiss }) : null);
  }

  function SettingsSection(props) {
    return h('section', { className: cx('tc-section', props.className), 'aria-label': props.title },
      props.title || props.description || props.headerAside ? h('div', { className: 'tc-section-head', style: props.headerAside ? { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 } : null },
        h('div', { style: { flex: '1 1 240px' } },
          props.title ? h('h2', { className: 'tc-section-title' }, props.title) : null,
          props.description ? h('p', { className: 'tc-section-desc' }, props.description) : null),
        props.headerAside || null) : null,
      props.padded ? h('div', { className: 'tc-section-pad' }, props.children) : props.children);
  }

  function SettingRow(props) {
    var asLabel = props.asLabel !== false;
    return h(asLabel ? 'label' : 'div', { className: cx('tc-row', props.className) },
      h('span', { className: 'tc-row-text' },
        h('span', { className: 'tc-row-title' }, props.title, props.badge || null),
        props.description ? h('span', { className: 'tc-row-desc' }, props.description) : null),
      props.control);
  }

  function SaveBar(props) {
    return h('div', { className: 'tc-savebar', role: 'status' },
      h('span', { className: 'tc-savebar-text' }, props.children),
      h(Button, { variant: 'ghost', onClick: props.onDiscard }, props.discardLabel || 'Discard'),
      h(Button, { variant: 'primary', onClick: props.onSave }, props.saveLabel || 'Save changes'));
  }

  function Composer(props) {
    var internal = React.useState('');
    var value = props.value != null ? props.value : internal[0];
    var setValue = props.onChange || internal[1];
    var own = React.useRef(null), ref = props.inputRef || own;
    var id = React.useId();
    function send() {
      var text = value.trim();
      if (!text) return;
      if (props.onSend) props.onSend(text);
      setValue('');
    }
    React.useEffect(function () {
      var el = ref.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }, [value]);
    React.useEffect(function () { if (props.replyTo && ref.current) ref.current.focus(); }, [props.replyTo]);
    function focusInput(e) {
      // Les menus et fenêtres rendus en portail remontent leurs événements React jusqu'ici sans être dans le composeur.
      if (!e.currentTarget.contains(e.target) || e.target.closest('button,a,input,select,textarea,[role=menu],[role=menuitem]')) return;
      e.preventDefault();
      ref.current.focus();
    }
    return h('div', { className: 'tc-composer', onMouseDown: focusInput },
      props.replyTo ? h('div', { className: 'tc-composer-reply' },
        h(Icon, { name: 'reply', size: 14 }),
        h('span', { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } },
          'Replying to ', h('strong', { style: { color: 'var(--text-2)', fontWeight: 600 } }, props.replyTo.author), ' ', props.replyTo.text),
        h(IconButton, { icon: 'x', label: 'Cancel reply', size: 24, iconSize: 13, onClick: props.onCancelReply })) : null,
      h('label', { htmlFor: id, className: 'tc-sr' }, props.label || 'Message'),
      h('textarea', {
        id: id, ref: ref, rows: 1, placeholder: props.placeholder, value: value,
        onChange: function (e) { setValue(e.target.value); if (props.onTyping) props.onTyping(); },
        onKeyDown: function (e) {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
          if (e.key === 'Escape' && props.replyTo && props.onCancelReply) props.onCancelReply();
        }
      }),
      h('div', { className: 'tc-composer-bar' },
        props.onEmoji ? h(IconButton, { icon: 'smile', label: 'Emoji', size: 30, iconSize: 16, onClick: props.onEmoji }) : null,
        props.onAttach ? h(IconButton, { icon: 'paperclip', label: 'Attach media', size: 30, iconSize: 16, onClick: props.onAttach }) : null,
        h('span', { style: { flex: 1 } }),
        props.aside || null,
        props.beforeSend || null,
        h('button', { type: 'button', className: 'tc-send', 'aria-label': 'Send message', disabled: !value.trim(), onClick: send }, h(Icon, { name: 'send', size: 16 }))));
  }

  function Skeleton(props) {
    return h('span', { className: cx('tc-skeleton', props.circle && 'tc-skeleton-circle'), style: { width: props.width, height: props.height || 12 }, 'aria-hidden': 'true' });
  }

  function Spinner(props) {
    var size = props.size || 16;
    return h('span', { className: 'tc-spinner', style: { width: size, height: size }, 'aria-hidden': props.label ? undefined : 'true', role: props.label ? 'img' : undefined, 'aria-label': props.label },
      h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5, strokeLinecap: 'round' },
        h('circle', { cx: 12, cy: 12, r: 9, opacity: 0.25 }), h('path', { d: 'M21 12a9 9 0 0 0-9-9' })));
  }

  var api = {
    Icon: Icon, Button: Button, IconButton: IconButton, TextField: TextField, Switch: Switch, Checkbox: Checkbox,
    SegmentedControl: SegmentedControl, Badge: Badge, CountBadge: CountBadge, Avatar: Avatar, NavItem: NavItem,
    Message: Message, DayDivider: DayDivider, Banner: Banner, SettingsSection: SettingsSection, SettingRow: SettingRow,
    SaveBar: SaveBar, Composer: Composer, Skeleton: Skeleton, Spinner: Spinner,
    avatarColor: avatarColor, iconNames: Object.keys(ICONS)
  };
  window.Torch = Object.assign(window.Torch || {}, api);
})();
