/* ---------- Live operations: what the bridge emits, applied to the state ---------- */
/**
 * Hands each bridge operation to the handler of the latest render.
 * The operations received after login wait for its first render: until then they would read the signed-out state, without groups, users or route.
 * @param {function(Object)} handle Handler of this render.
 * @param {boolean} loggedIn The state of this render is signed in.
 */
function useBridgeOps(handle, loggedIn) {
  var latest = useRef(handle), held = useRef(null);
  latest.current = handle;
  useEffect(function () {
    if (!LIVE || !liveBridge) return;
    return liveBridge.onOp(function (op) {
      if (held.current) { held.current.push(op); return; }
      latest.current(op);
      if (op.op === 'login') held.current = [];
    });
  }, []);
  useEffect(function () {
    var ops = held.current;
    if (!ops || !loggedIn) return;
    held.current = null;
    ops.forEach(function (op) { deliverOp(latest.current, op); });
  }, [loggedIn]);
}
