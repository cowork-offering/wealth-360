/* ============================================================
   ROADSHOW GATE — invitation-only overlay for the summit site.
   Loaded synchronously in <head> on every page. If the visitor holds no valid
   unlock, the page is hidden from first paint (no flash) and a frosted reeded-glass
   pane covers the viewport. The right access phrase parts the glass and the page
   plays. Client-side only: this is a courtesy lock for an invited audience, not a
   security boundary (GitHub Pages serves static files).

   Access is remembered on this device for 30 days. Append ?lock to any URL to
   re-lock (booth reset), or call rsGate.lock() from the console.
   ============================================================ */
(function () {
  var KEY = 'rs.gate.v1';
  var SALT = 'roadshow-2026:';
  var HASH = 'bb95e907d280e0eebbe6a7d995cf76a2c5006f3d4d6a2fad0b5e672ca43019ce';
  var TTL = 30 * 24 * 3600 * 1000;
  var root = document.documentElement;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function lock() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.href = location.pathname;
  }
  function unlocked() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return !!(v && v.h === HASH && v.t > Date.now());
    } catch (e) { return false; }
  }
  try { if (/[?&]lock(=|&|$)/.test(location.search)) { localStorage.removeItem(KEY); } } catch (e) {}

  var waiters = [];
  var api = {
    locked: !unlocked(),
    lock: lock,
    whenOpen: function (fn) { if (api.locked) { waiters.push(fn); } else { fn(); } }
  };
  window.rsGate = api;
  if (!api.locked) { return; }

  /* ---- critical CSS: hide the page from first paint, no flash ---- */
  root.classList.add('gate-locked');
  var crit = document.createElement('style');
  crit.textContent =
    'html.gate-locked{overflow:hidden!important;background:#0A0A0B}' +
    'html.gate-locked body>*:not(#rs-gate){visibility:hidden!important}';
  document.head.appendChild(crit);

  /* ---- SHA-256 (WebCrypto with a tiny pure-JS fallback for file:// previews) ---- */
  function sha256js(str) {
    var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
    var H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    var b = unescape(encodeURIComponent(str)), l = b.length, w = [], i;
    for (i = 0; i < l; i++) { w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8); }
    w[l >> 2] |= 0x80 << (24 - (l % 4) * 8);
    w[((l + 8 >> 6) << 4) + 15] = l * 8;
    var W = new Array(64), r = function (x, n) { return (x >>> n) | (x << (32 - n)); };
    for (var j = 0; j < w.length; j += 16) {
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7], t;
      for (t = 0; t < 64; t++) {
        W[t] = t < 16 ? (w[j + t] | 0) : ((r(W[t-2],17) ^ r(W[t-2],19) ^ (W[t-2] >>> 10)) + W[t-7] + (r(W[t-15],7) ^ r(W[t-15],18) ^ (W[t-15] >>> 3)) + W[t-16]) | 0;
        var T1 = (h + (r(e,6) ^ r(e,11) ^ r(e,25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) | 0;
        var T2 = ((r(a,2) ^ r(a,13) ^ r(a,22)) + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        h = g; g = f; f = e; e = (d + T1) | 0; d = c; c = bb; bb = a; a = (T1 + T2) | 0;
      }
      H[0]=(H[0]+a)|0; H[1]=(H[1]+bb)|0; H[2]=(H[2]+c)|0; H[3]=(H[3]+d)|0; H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function digest(str) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      });
    }
    return Promise.resolve(sha256js(str));
  }

  /* ---- overlay styles (Accenture register: neutral near-black, Graphik, violet) ---- */
  var css =
  '#rs-gate{position:fixed;inset:0;z-index:2147483000;font-family:var(--font-sans,"Graphik","Helvetica Neue",Arial,sans-serif);color:#F1F1EF;' +
    '-webkit-font-smoothing:antialiased;display:flex;align-items:center;justify-content:center;overflow:hidden;' +
    '--rs-silk:cubic-bezier(.16,1,.3,1);--rs-violet:#A100FF;--rs-lav:#C9A9FF;--rs-pink:#FF50A0}' +
  '#rs-gate *{box-sizing:border-box;margin:0}' +
  /* the two panes of reeded glass. One image spans both; each pane shows its half. */
  '#rs-gate .rs-pane{position:absolute;top:0;bottom:0;width:50.5%;background:#0A0A0B;overflow:hidden;will-change:transform;' +
    'transition:transform 1.5s var(--rs-silk)}' +
  '#rs-gate .rs-pane.l{left:0}#rs-gate .rs-pane.r{right:0}' +
  '#rs-gate .rs-pane::before{content:"";position:absolute;inset:-6%;background:url("media/glass-texture-graded.webp") center/cover no-repeat;' +
    'opacity:.16;mix-blend-mode:screen;filter:saturate(.7) brightness(.9);transform:scale(1);animation:rsDrift 26s ease-in-out infinite alternate}' +
  '#rs-gate .rs-pane.r::before{animation-delay:-13s}' +
  '#rs-gate .rs-pane::after{content:"";position:absolute;inset:0;background:' +
    'radial-gradient(120% 90% at 50% 110%,rgba(10,10,11,0) 0%,rgba(10,10,11,.55) 60%,#0A0A0B 100%),' +
    'linear-gradient(180deg,rgba(10,10,11,.85),rgba(10,10,11,.35) 40%,rgba(10,10,11,.35) 60%,rgba(10,10,11,.9))}' +
  '@keyframes rsDrift{from{transform:scale(1) translateY(0)}to{transform:scale(1.06) translateY(-1.5%)}}' +
  /* the seam: the site\'s pink thread, where the two panes meet */
  '#rs-gate .rs-seam{position:absolute;top:0;bottom:0;left:50%;width:1px;transform:translateX(-.5px);' +
    'background:linear-gradient(180deg,transparent 0,rgba(255,80,160,.6) 10%,rgba(255,80,160,.6) 18%,transparent 27%,transparent 73%,rgba(255,80,160,.6) 82%,rgba(255,80,160,.6) 90%,transparent 100%);opacity:.75;' +
    'transition:opacity .5s ease}' +
  /* violet bloom behind the lockup */
  '#rs-gate .rs-glow{position:absolute;inset:0;pointer-events:none;' +
    'background:radial-gradient(52vmax 36vmax at 50% 58%,rgba(161,0,255,.20),rgba(161,0,255,0) 62%);' +
    'transition:opacity .7s ease}' +
  /* the card */
  '#rs-gate .rs-card{position:relative;width:min(560px,calc(100vw - 48px));padding:0 8px;text-align:left;' +
    'opacity:0;transform:translateY(14px);transition:opacity 1.1s var(--rs-silk) .15s,transform 1.1s var(--rs-silk) .15s}' +
  '#rs-gate.in .rs-card{opacity:1;transform:none}' +
  '#rs-gate .rs-brand{display:flex;align-items:baseline;gap:14px;margin-bottom:clamp(36px,7vh,64px)}' +
  '#rs-gate .rs-brand img{height:34px;width:auto;display:block;transform:translateY(3.7%)}' +
  '#rs-gate .rs-brand .rs-div{width:1px;height:11px;background:rgba(255,255,255,.4);flex:none;transform:translateY(-2px)}' +
  '#rs-gate .rs-brand .rs-wm{font-size:14px;font-weight:500;letter-spacing:.02em;color:#fff;white-space:nowrap;transform:translateY(-2px)}' +
  '#rs-gate .rs-eyebrow{font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--rs-lav);margin-bottom:18px}' +
  '#rs-gate h1{font-size:clamp(40px,6.2vw,76px);font-weight:300;line-height:1.04;letter-spacing:-.025em;color:#F1F1EF;margin-bottom:18px}' +
  '#rs-gate h1 em{font-style:normal;color:var(--rs-violet)}' +
  '#rs-gate .rs-lead{font-size:16px;line-height:1.5;color:rgba(241,241,239,.62);max-width:40ch;margin-bottom:clamp(28px,5vh,44px)}' +
  /* the field: one hairline, one caret, one arrow */
  '#rs-gate form{max-width:420px}' +
  '#rs-gate .rs-field{position:relative;display:flex;align-items:center;gap:8px;padding-bottom:12px}' +
  '#rs-gate .rs-field::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:rgba(255,255,255,.22);transition:background .3s ease}' +
  '#rs-gate .rs-field::before{content:"";position:absolute;left:0;bottom:0;height:1px;width:100%;background:var(--rs-violet);z-index:1;' +
    'transform:scaleX(0);transform-origin:left;transition:transform .7s var(--rs-silk);box-shadow:0 0 14px rgba(161,0,255,.55)}' +
  '#rs-gate .rs-field:focus-within::before{transform:scaleX(1)}' +
  '#rs-gate .rs-field.err::after{background:var(--rs-pink)}#rs-gate .rs-field.err::before{background:var(--rs-pink);box-shadow:0 0 14px rgba(255,80,160,.5)}' +
  '#rs-gate .rs-field.ok::before{background:#fff;box-shadow:0 0 18px rgba(255,255,255,.7)}' +
  '#rs-gate input{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font:inherit;font-size:20px;font-weight:300;letter-spacing:.02em;padding:10px 0;caret-color:var(--rs-violet)}' +
  '#rs-gate input::placeholder{color:rgba(241,241,239,.34);font-weight:300;letter-spacing:0}' +
  '#rs-gate input[type=password]{letter-spacing:.22em}' +
  '#rs-gate input:-webkit-autofill{-webkit-text-fill-color:#fff;-webkit-box-shadow:0 0 0 1000px #0A0A0B inset;transition:background-color 9999s}' +
  '#rs-gate button{appearance:none;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;padding:0}' +
  '#rs-gate .rs-eye{width:36px;height:36px;display:grid;place-items:center;color:rgba(241,241,239,.5);border-radius:50%;transition:color .25s ease,background .25s ease}' +
  '#rs-gate .rs-eye:hover,#rs-gate .rs-eye:focus-visible{color:#fff;background:rgba(255,255,255,.06);outline:0}' +
  '#rs-gate .rs-eye svg{width:18px;height:18px;display:block}#rs-gate .rs-eye .off{display:none}#rs-gate .rs-eye.show .on{display:none}#rs-gate .rs-eye.show .off{display:block}' +
  '#rs-gate .rs-go{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.28);display:grid;place-items:center;flex:none;color:#fff;' +
    'transition:background .35s ease,border-color .35s ease,transform .35s var(--rs-silk),box-shadow .35s ease}' +
  '#rs-gate .rs-go svg{width:18px;height:18px;display:block;transition:transform .35s var(--rs-silk)}' +
  '#rs-gate .rs-go:hover,#rs-gate .rs-go:focus-visible{background:var(--rs-violet);border-color:var(--rs-violet);box-shadow:0 0 28px rgba(161,0,255,.45);outline:0}' +
  '#rs-gate .rs-go:hover svg{transform:translateX(3px)}' +
  '#rs-gate .rs-go.busy{pointer-events:none;border-color:var(--rs-violet)}' +
  '#rs-gate .rs-err{min-height:22px;margin-top:12px;font-size:13px;color:var(--rs-pink);opacity:0;transform:translateY(-4px);transition:opacity .35s ease,transform .35s ease}' +
  '#rs-gate .rs-err.show{opacity:1;transform:none}' +
  '#rs-gate .rs-foot{margin-top:clamp(36px,8vh,72px);font-size:12px;letter-spacing:.04em;color:rgba(241,241,239,.38);display:flex;gap:14px;align-items:center}' +
  '#rs-gate .rs-foot i{width:4px;height:4px;border-radius:50%;background:var(--rs-pink);display:inline-block;flex:none}' +
  /* wrong phrase: the card recoils */
  '@keyframes rsShake{0%,100%{transform:translateX(0)}18%{transform:translateX(-7px)}36%{transform:translateX(6px)}54%{transform:translateX(-4px)}72%{transform:translateX(3px)}}' +
  '#rs-gate.in .rs-card.shake{animation:rsShake .5s cubic-bezier(.36,.07,.19,.97) both}' +
  /* right phrase: the glass parts, the card dissolves, the page is already underneath */
  '#rs-gate.open{pointer-events:none}' +
  '#rs-gate.open .rs-pane.l{transform:translateX(-102%)}#rs-gate.open .rs-pane.r{transform:translateX(102%)}' +
  '#rs-gate.open .rs-seam,#rs-gate.open .rs-glow{opacity:0}' +
  '#rs-gate.open .rs-card{opacity:0;transform:translateY(-10px) scale(.985);transition:opacity .5s ease,transform .8s var(--rs-silk)}' +
  '@media(max-width:560px){#rs-gate .rs-brand img{height:26px}#rs-gate .rs-brand .rs-wm{font-size:12.5px}#rs-gate .rs-card{padding:0 4px}#rs-gate input{font-size:18px}}' +
  '@media(prefers-reduced-motion:reduce){#rs-gate .rs-pane::before{animation:none}#rs-gate .rs-pane,#rs-gate .rs-card,#rs-gate .rs-field::before{transition-duration:.2s}#rs-gate.in .rs-card.shake{animation:none}}';

  var EYE_ON = '<svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.3A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a17.5 17.5 0 0 1-3.1 4"/><path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>';

  function mount() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var g = document.createElement('div');
    g.id = 'rs-gate'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'rs-gate-title');
    g.innerHTML =
      '<div class="rs-pane l" aria-hidden="true"></div><div class="rs-pane r" aria-hidden="true"></div>' +
      '<div class="rs-glow" aria-hidden="true"></div><div class="rs-seam" aria-hidden="true"></div>' +
      '<div class="rs-card">' +
        '<div class="rs-brand"><img src="ds/logos/accenture-logo-white.svg" alt="Accenture" /><span class="rs-div" aria-hidden="true"></span><span class="rs-wm">Commercial Banking</span></div>' +
        '<p class="rs-eyebrow">Summit roadshow · 2026 · By invitation</p>' +
        '<h1 id="rs-gate-title">Before the<br>opening<em>.</em></h1>' +
        '<p class="rs-lead">This room is private. Enter the access phrase you were given and the glass parts.</p>' +
        '<form novalidate autocomplete="off">' +
          '<label for="rs-gate-pw" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Access phrase</label>' +
          '<div class="rs-field">' +
            '<input id="rs-gate-pw" type="password" placeholder="Access phrase" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" />' +
            '<button type="button" class="rs-eye" aria-label="Show phrase" aria-pressed="false">' + EYE_ON + EYE_OFF + '</button>' +
            '<button type="submit" class="rs-go" aria-label="Enter">' + ARROW + '</button>' +
          '</div>' +
          '<p class="rs-err" role="status" aria-live="polite"></p>' +
        '</form>' +
        '<p class="rs-foot"><i></i><span>Confidential preview · not for distribution</span></p>' +
      '</div>';
    document.body.appendChild(g);

    var form = g.querySelector('form'), input = g.querySelector('input'), field = g.querySelector('.rs-field'),
        eye = g.querySelector('.rs-eye'), go = g.querySelector('.rs-go'), err = g.querySelector('.rs-err'), card = g.querySelector('.rs-card');

    requestAnimationFrame(function () { requestAnimationFrame(function () {
      g.classList.add('in');
      setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, RM ? 50 : 500);
    }); });

    eye.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.classList.toggle('show', show);
      eye.setAttribute('aria-pressed', String(show));
      eye.setAttribute('aria-label', show ? 'Hide phrase' : 'Show phrase');
      input.focus({ preventScroll: true });
    });
    input.addEventListener('input', function () { field.classList.remove('err'); err.classList.remove('show'); });

    var busy = false, strikes = 0;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (busy) { return; }
      var v = input.value.trim();
      if (!v) { input.focus(); return; }
      busy = true; go.classList.add('busy');
      digest(SALT + v.toLowerCase()).then(function (h) {
        busy = false; go.classList.remove('busy');
        if (h === HASH) { open(); return; }
        strikes++;
        field.classList.add('err');
        err.textContent = strikes < 3 ? 'That phrase is not on the list.' : 'Still not it. Ask your host for the phrase.';
        err.classList.add('show');
        card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        input.select();
      });
    });

    function open() {
      try { localStorage.setItem(KEY, JSON.stringify({ h: HASH, t: Date.now() + TTL })); } catch (e) {}
      field.classList.add('ok'); input.blur();
      setTimeout(function () {
        api.locked = false;
        root.classList.remove('gate-locked');   /* the page is underneath as the glass parts */
        g.classList.add('open');
        window.dispatchEvent(new CustomEvent('gate:unlocked'));
        var w = waiters.splice(0); for (var i = 0; i < w.length; i++) { try { w[i](); } catch (e) {} }
        setTimeout(function () { g.remove(); crit.remove(); st.remove(); }, RM ? 300 : 1700);
      }, RM ? 60 : 420);
    }
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', mount); } else { mount(); }
})();
