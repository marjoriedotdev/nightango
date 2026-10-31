/* ---------- Overlays: toasts, dialogs and navigation drawer ---------- */
/**
 * Toasts, dialogs and navigation drawer that the views open through ui.
 * @returns {Object} toast, ui, the navigation drawer, the open dialogs and the toasts with their setters.
 */
function useOverlays() {
  var u1 = useState([]), toasts = u1[0], setToasts = u1[1];
  var u2 = useState(null), confirmCfg = u2[0], setConfirm = u2[1];
  var u3 = useState(null), profile = u3[0], setProfile = u3[1];
  var u4 = useState(null), linkUrl = u4[0], setLinkUrl = u4[1];
  var u5 = useState(false), palette = u5[0], setPalette = u5[1];
  var u6 = useState(null), create = u6[0], setCreate = u6[1];
  var u7 = useState(false), newDm = u7[0], setNewDm = u7[1];
  var u8 = useState(null), banCfg = u8[0], setBan = u8[1];
  var u9 = useState(false), navOpen = u9[0], setNavOpen = u9[1];
  var u11 = useState(null), fullProfile = u11[0], setFullProfile = u11[1];
  var u12 = useState(null), profileLink = u12[0], setProfileLink = u12[1];
  var u14 = useState(null), who = u14[0], setWho = u14[1];
  var toast = useCallback(function (text, opts) {
    var t = Object.assign({ id: uid(), text: text }, opts || {});
    setToasts(function (list) { return list.concat([t]).slice(-4); });
  }, []);
  function dismissToast(id) { setToasts(function (list) { return list.filter(function (x) { return x.id !== id; }); }); }
  var ui = useMemo(function () { return {
    toast: toast,
    confirm: setConfirm,
    // The full profile dialog covers the profile dialog: a profile opened from its links would stay hidden under it.
    openProfile: function (name, gid) { setFullProfile(null); setProfile({ name: name, gid: gid }); },
    openFullProfile: function (name) { setFullProfile(name); },
    openWho: setWho,
    openLink: setLinkUrl,
    openProfileLink: setProfileLink,
    openPalette: function () { setPalette(true); setNavOpen(false); },
    openCreate: function (prefill) { setCreate({ prefill: prefill || '' }); setNavOpen(false); },
    openNewDm: function () { setNewDm(true); setNavOpen(false); },
    ban: function (name, gid, msg) { setBan({ name: name, gid: gid, msg: msg || null }); },
    openNav: function () { setNavOpen(true); },
    closeNav: function () { setNavOpen(false); }
  }; }, []);
  return {
    toast: toast, ui: ui, toasts: toasts, dismissToast: dismissToast,
    navOpen: navOpen, setNavOpen: setNavOpen, palette: palette, setPalette: setPalette,
    confirmCfg: confirmCfg, setConfirm: setConfirm, profile: profile, setProfile: setProfile, fullProfile: fullProfile, setFullProfile: setFullProfile,
    who: who, setWho: setWho, linkUrl: linkUrl, setLinkUrl: setLinkUrl, profileLink: profileLink, setProfileLink: setProfileLink,
    create: create, setCreate: setCreate, newDm: newDm, setNewDm: setNewDm, banCfg: banCfg, setBan: setBan
  };
}
