/* Talks to the accounts backend (Supabase) with plain fetch, no library. Only js/sync.js calls this file.
   Backend.on is false until js/config.js is filled in; then nothing here runs.
   Tables, rules and settings it expects are in docs/BACKEND.md. */
var Backend = (function(){
  var cfg = window.KLAAR_CONFIG || {}, base = String(cfg.supabaseUrl || "").replace(/\/+$/, ""), key = String(cfg.supabaseKey || "");
  var on = /^https:\/\/[^\/]+$/.test(base) && key.length > 20;

  function call(path, body, token, extra, method){
    var headers = {"apikey": key, "Content-Type": "application/json"};
    if (token) headers.Authorization = "Bearer " + token;
    if (extra) Object.keys(extra).forEach(function(k){ headers[k] = extra[k]; });
    return fetch(base + path, {method: method || (body === undefined ? "GET" : "POST"), headers: headers, body: body === undefined ? undefined : JSON.stringify(body)})
      .then(function(r){
        return r.text().then(function(txt){
          var data = null; try{ data = txt ? JSON.parse(txt) : null; }catch(e){}
          if (!r.ok){ var err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("HTTP " + r.status)); err.status = r.status; err.code = data && (data.error_code || data.code || data.error); throw err; }
          return data;
        });
      });
  }
  function toSession(d){ return {access: d.access_token, refresh: d.refresh_token, uid: d.user && d.user.id, email: d.user && d.user.email, exp: Date.now() + (Number(d.expires_in) || 3600) * 1000}; }

  /* a new account by email and password. "Confirm email" must be off in Supabase, or no session comes back. */
  function signUp(email, password){
    return call("/auth/v1/signup", {email: email, password: password}).then(function(d){
      if (!d || !d.access_token){ var err = new Error("no session"); err.status = 409; err.code = "no_session"; throw err; }
      return toSession(d);
    });
  }
  function signIn(email, password){ return call("/auth/v1/token?grant_type=password", {email: email, password: password}).then(toSession); }
  /* a fresh access token when the old one is about to run out; onSession lets the caller save it */
  function fresh(session, onSession){
    if (session.exp - Date.now() > 60000) return Promise.resolve(session);
    return call("/auth/v1/token?grant_type=refresh_token", {refresh_token: session.refresh}).then(function(d){
      var s = toSession(d); if (!s.uid) s.uid = session.uid; if (!s.email) s.email = session.email;
      if (onSession) onSession(s); return s;
    });
  }
  var UPSERT = {"Prefer": "resolution=merge-duplicates,return=minimal"};
  function saveProgress(session, data){ return call("/rest/v1/progress?on_conflict=user_id", {user_id: session.uid, data: data, updated_at: new Date().toISOString()}, session.access, UPSERT); }
  function loadProgress(session){ return call("/rest/v1/progress?select=data&user_id=eq." + encodeURIComponent(session.uid), undefined, session.access).then(function(rows){ return rows && rows[0] ? rows[0].data : null; }); }
  /* removes the account and, through "on delete cascade", the saved progress. See delete_me() in docs/BACKEND.md */
  function deleteMe(session){ return call("/rest/v1/rpc/delete_me", {}, session.access); }
  function signOut(session){ return call("/auth/v1/logout", {}, session.access).catch(function(){}); }

  return {on: on, signUp: signUp, signIn: signIn, fresh: fresh, saveProgress: saveProgress, loadProgress: loadProgress, deleteMe: deleteMe, signOut: signOut};
})();
