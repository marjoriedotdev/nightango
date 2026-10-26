var React = window.React, ReactDOM = window.ReactDOM, h = React.createElement;
// In live mode, each avatar gets the Chatango picture of the account or group it represents.
var T = Object.assign({}, window.Torch, {
  Avatar: function (p) { return h(window.Torch.Avatar, p.src !== undefined ? p : Object.assign({}, p, { src: avatarSrc(p.name, p.size) })); }
});
var useState = React.useState, useEffect = React.useEffect, useLayoutEffect = React.useLayoutEffect, useRef = React.useRef,
  useMemo = React.useMemo, useCallback = React.useCallback, useContext = React.useContext, Frag = React.Fragment;
