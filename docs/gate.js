/* ============================================================
   WEALTH 360 ACCESS GATE
   Loaded synchronously in <head>. Without a valid unlock the page is hidden from
   first paint and a split entry screen covers it: the film on one side, the access
   phrase on the other. The right phrase reveals the page underneath.
   Client-side only: a courtesy lock for a shared preview, not a security boundary
   (GitHub Pages serves static files).
   Access is remembered on this device for 30 days. Append ?lock to the URL to lock
   again, or call w360Gate.lock() from the console.
   ============================================================ */
(function () {
  var KEY = 'w360.gate.v1';
  var SALT = 'wealth360-2026:';
  var HASH = 'f785661e7d690a4ba5dad47e6f37e12b4a43ebf74a1b9bdd739b652533394d49';
  var TTL = 30 * 24 * 3600 * 1000;
  var root = document.documentElement;
  var RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function unlocked() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      return !!(v && v.h === HASH && v.t > Date.now());
    } catch (e) { return false; }
  }
  try { if (/[?&]lock(=|&|$)/.test(location.search)) { localStorage.removeItem(KEY); } } catch (e) {}
  window.w360Gate = { lock: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.href = location.pathname; } };
  if (unlocked()) { return; }

  root.classList.add('w360-locked');
  var css = [
    'html.w360-locked{scrollbar-gutter:auto!important;overflow:hidden!important}html.w360-locked body{visibility:hidden;overflow:hidden}',
    '#w360g{--pw:max(380px,42.5vw);position:fixed;inset:0;z-index:2147483000;background:#08080A;overflow:hidden;',
    '  font-family:"Graphik",Arial,sans-serif;color:#F1F1EF;-webkit-font-smoothing:antialiased;visibility:visible}',
    '#w360g *{box-sizing:border-box}',
    /* film side */
    '#w360g .gf{position:absolute;inset:0;overflow:hidden;background:#000}',
    '#w360g .gf .mv{position:absolute;inset:0;transform-origin:30% 50%}',
    '#w360g .gf img,#w360g .gf video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '#w360g .gf video{opacity:0;transition:opacity 1.6s ease}',
    '#w360g .gf video.on{opacity:1}',
    '#w360g .gf .sc{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,.05) 35%,rgba(0,0,0,.55) 72%,rgba(0,0,0,.92) 100%),',
    '  linear-gradient(90deg,rgba(0,0,0,0) 40%,rgba(8,8,10,.75) 100%)}',
    '#w360g .gf .tx{position:absolute;left:clamp(28px,4.4vw,72px);right:calc(var(--pw) + clamp(28px,4vw,64px));bottom:clamp(36px,7vh,80px)}',
    '#w360g .ey{display:inline-flex;align-items:center;gap:11px;font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.86)}',
    '#w360g .ey i{width:6px;height:6px;border-radius:50%;background:#A100FF;box-shadow:0 0 12px #A100FF}',
    '#w360g h1{margin:18px 0 0;font-weight:700;text-transform:uppercase;letter-spacing:-.04em;line-height:.88;font-size:clamp(56px,8.6vw,132px);color:#fff}',
    '#w360g h1 span{display:block}#w360g h1 span+span{margin-left:clamp(18px,4.5vw,84px)}',
    '#w360g .gf p{margin:22px 0 0;max-width:38ch;font-size:clamp(15px,1.25vw,18px);line-height:1.5;color:rgba(255,255,255,.84)}',
    '#w360g .gf p b{color:#fff;font-weight:500}',
    /* access side */
    '#w360g .ga{position:absolute;top:0;right:0;bottom:0;width:var(--pw);display:flex;flex-direction:column;padding:clamp(28px,4vw,56px) clamp(28px,4.4vw,72px);',
    '  background:radial-gradient(120% 70% at 100% 0%,rgba(161,0,255,.16),rgba(161,0,255,0) 60%),#0A0A0C;border-left:1px solid rgba(255,255,255,.08)}',
    '#w360g .lg{display:flex;align-items:center;gap:14px}',
    '#w360g .lg img{height:30px;width:auto;display:block}',
    '#w360g .lg s{width:1px;height:12px;background:rgba(255,255,255,.35)}',
    '#w360g .lg span{font-size:13.5px;font-weight:500;letter-spacing:.02em;color:#fff;transform:translateY(2px)}',
    '#w360g .md{margin:auto 0;max-width:420px;width:100%}',
    '#w360g .pv{display:flex;align-items:center;gap:14px;font-size:10.5px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#C9A9FF}',
    '#w360g .pv::before{content:"";width:28px;height:1px;background:#A100FF}',
    '#w360g h2{margin:22px 0 0;font-weight:300;font-size:clamp(34px,3.2vw,48px);letter-spacing:-.035em;line-height:1.04;color:#fff}',
    '#w360g h2 b{font-weight:600;white-space:nowrap}',
    '#w360g .ds{margin:18px 0 0;font-size:15px;line-height:1.6;color:rgba(241,241,239,.62);max-width:36ch}',
    '#w360g form{margin:44px 0 0}',
    '#w360g label{display:block;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:rgba(241,241,239,.6);margin-bottom:10px}',
    '#w360g .fl{position:relative;display:flex;align-items:center;height:60px;border-bottom:1px solid rgba(255,255,255,.22)}',
    '#w360g .fl::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:#A100FF;transform:scaleX(0);transform-origin:left;transition:transform .5s cubic-bezier(.16,1,.3,1)}',
    '#w360g .fl:focus-within::after{transform:scaleX(1)}',
    '#w360g .fl.bad::after{background:#ff7a7a;transform:scaleX(1)}',
    '#w360g input{flex:1;min-width:0;height:100%;background:transparent;border:0;outline:0;padding:0 8px 0 0;color:#fff;',
    '  font:300 22px/1 "Graphik",Arial,sans-serif;letter-spacing:.01em}',
    '#w360g input::placeholder{color:rgba(241,241,239,.36)}',
    '#w360g .ey2{appearance:none;background:transparent;border:0;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;color:rgba(241,241,239,.55);border-radius:10px}',
    '#w360g .ey2:hover,#w360g .ey2:focus-visible{color:#fff;outline:none;background:rgba(255,255,255,.06)}',
    '#w360g .ey2 svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}',
    '#w360g .go{appearance:none;border:0;cursor:pointer;margin-left:6px;width:48px;height:48px;flex:none;border-radius:50%;background:#A100FF;color:#fff;',
    '  display:inline-flex;align-items:center;justify-content:center;transition:background .2s ease,transform .3s cubic-bezier(.16,1,.3,1),box-shadow .3s ease}',
    '#w360g .go:hover{background:#8a00db;transform:translateX(3px);box-shadow:0 8px 28px rgba(161,0,255,.45)}#w360g .go:active{transform:scale(.95)}',
    '#w360g .go:focus-visible{outline:2px solid #C9A9FF;outline-offset:3px}',
    '#w360g .go svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '#w360g .go .sp{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:w360s .7s linear infinite;display:none}',
    '#w360g .go.busy .sp{display:block}#w360g .go.busy .ar{display:none}',
    '#w360g .msg{min-height:22px;margin:14px 0 0;font-size:13px;line-height:1.4;color:#ff8f8f;opacity:0;transform:translateY(-3px);transition:opacity .25s ease,transform .25s ease}',
    '#w360g .msg.on{opacity:1;transform:none}',
    '#w360g .hp{margin:22px 0 0;font-size:13px;line-height:1.55;color:rgba(241,241,239,.45)}',
    '#w360g .ft{display:flex;align-items:center;gap:10px;font-size:11.5px;color:rgba(241,241,239,.45)}',
    '#w360g .ft i{width:5px;height:5px;border-radius:50%;background:#A100FF}',
    '@keyframes w360s{to{transform:rotate(360deg)}}',
    '@keyframes w360k{10%,90%{transform:translateX(-2px)}20%,80%{transform:translateX(4px)}30%,50%,70%{transform:translateX(-7px)}40%,60%{transform:translateX(7px)}}',
    '#w360g .fl.shake{animation:w360k .5s cubic-bezier(.36,.07,.19,.97) both}',
    /* entrance and exit */
    '@keyframes w360u{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '#w360g .md>*{animation:w360u .9s cubic-bezier(.16,1,.3,1) both}',
    '#w360g .md>*:nth-child(2){animation-delay:.08s}#w360g .md>*:nth-child(3){animation-delay:.14s}#w360g .md>*:nth-child(4){animation-delay:.2s}#w360g .md>*:nth-child(5){animation-delay:.26s}',
    '#w360g .gf .tx>*{animation:w360u 1.1s cubic-bezier(.16,1,.3,1) both}#w360g .gf .tx>*:nth-child(2){animation-delay:.12s}#w360g .gf .tx>*:nth-child(3){animation-delay:.24s}',
    /* exit: the panel clears, the film pushes in to full frame, then dissolves into the page */
    '#w360g.out .md>*,#w360g.out .lg,#w360g.out .ft{animation:w360o .45s cubic-bezier(.4,0,.2,1) both}',
    '@keyframes w360o{to{opacity:0;transform:translateY(-8px)}}',
    '#w360g.out .ga{transform:translateX(101%);transition:transform 1.05s cubic-bezier(.76,0,.24,1) .3s}',
    '#w360g.out .gf .mv{transform:scale(1.07);transition:transform 2.6s cubic-bezier(.22,1,.36,1)}',
    '#w360g.out .gf .sc{opacity:.55;transition:opacity 1.2s ease .4s}',
    '#w360g.out .gf .tx{right:clamp(28px,4vw,64px);opacity:0;transform:translateY(-14px);transition:opacity .7s ease 1.05s,transform 1s cubic-bezier(.16,1,.3,1) 1.05s,right 1.05s cubic-bezier(.76,0,.24,1) .3s}',
    '#w360g .ln{position:absolute;left:0;right:0;top:50%;height:1px;background:linear-gradient(90deg,rgba(161,0,255,0),#A100FF 30%,#C9A9FF 50%,#A100FF 70%,rgba(161,0,255,0));transform:scaleX(0);opacity:0;pointer-events:none}',
    '#w360g.out .ln{animation:w360l 1.1s cubic-bezier(.16,1,.3,1) 1.1s both}',
    '@keyframes w360l{0%{transform:scaleX(0);opacity:0}35%{opacity:1}100%{transform:scaleX(1);opacity:0}}',
    '#w360g.fade{opacity:0;filter:blur(6px);transition:opacity 1s ease,filter 1s ease}',
    'html.w360-in body{animation:w360f 1.3s ease both}',
    '@keyframes w360f{from{opacity:0}to{opacity:1}}',
    /* phone */
    '@media(max-width:860px){#w360g{--ph:max(56svh,430px)}',
    '  #w360g .ga{top:auto;width:auto;left:0;height:var(--ph);overflow-y:auto;border-left:0;border-top:1px solid rgba(255,255,255,.08);padding:26px 22px 22px}',
    '  #w360g .gf .tx,#w360g.out .gf .tx{left:22px;right:22px;bottom:calc(var(--ph) + 24px)}#w360g .gf .sc{background:linear-gradient(180deg,rgba(0,0,0,.3),rgba(0,0,0,.1) 30%,rgba(0,0,0,.8) 44%)}#w360g h1{font-size:clamp(46px,15vw,72px)}#w360g .gf p{display:none}',
    '  #w360g .md{margin:30px 0 26px;max-width:100%}#w360g h2{margin-top:16px;font-size:32px}#w360g .lg img{height:24px}#w360g input{font-size:19px}',
    '  #w360g.out .ga{transform:translateY(101%)}}',
    '@media(prefers-reduced-motion:reduce){#w360g *{animation:none!important;transition:none!important}}'
  ].join('\n');

  var EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var EYE_OFF = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var ARR = '<svg class="ar" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function build() {
    var st = document.createElement('style'); st.textContent = css; (document.head || root).appendChild(st);
    var g = document.createElement('div');
    g.id = 'w360g'; g.setAttribute('role', 'dialog'); g.setAttribute('aria-modal', 'true'); g.setAttribute('aria-labelledby', 'w360-h');
    g.innerHTML =
      '<div class="gf" aria-hidden="true">' +
        '<div class="mv"><img src="media/still-0.webp" alt="" />' +
        (RM ? '' : '<video muted loop playsinline autoplay preload="auto" poster="media/still-0.webp"><source src="media/hero.mp4" type="video/mp4" /></video>') + '</div>' +
        '<div class="sc"></div>' +
        '<div class="tx"><span class="ey"><i></i>Wealth servicing, reimagined</span>' +
        '<h1><span>Wealth</span><span>360.</span></h1>' +
        '<p>Agents do the work. Salesforce keeps the rules. <b>A named person makes every decision that matters.</b></p></div>' +
        '<i class="ln"></i>' +
      '</div>' +
      '<div class="ga">' +
        '<div class="lg"><img src="ds/logos/accenture-logo-white.svg" alt="Accenture" /><s></s><span>Wealth Management</span></div>' +
        '<div class="md">' +
          '<span class="pv">Private preview</span>' +
          '<h2 id="w360-h">Welcome to<br><b>Wealth 360</b></h2>' +
          '<p class="ds">This preview is shared with selected colleagues and clients. Enter the access phrase you received to continue.</p>' +
          '<form novalidate><label for="w360-pw" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Access phrase</label>' +
            '<div class="fl"><input id="w360-pw" type="password" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Access phrase" />' +
            '<button type="button" class="ey2" aria-label="Show phrase" aria-pressed="false">' + EYE + '</button>' +
            '<button type="submit" class="go" aria-label="Enter">' + ARR + '<i class="sp" aria-hidden="true"></i></button></div>' +
            '<p class="msg" role="alert" aria-live="assertive"></p></form>' +
          '<p class="hp">No phrase yet? Ask the person who shared this link with you.</p>' +
        '</div>' +
        '<div class="ft"><i></i>Proof of concept · fictional clients · not for distribution</div>' +
      '</div>';
    root.appendChild(g);

    var vid = g.querySelector('video');
    if (vid) {
      vid.addEventListener('playing', function () { vid.classList.add('on'); });
      var p = vid.play(); if (p && p.catch) { p.catch(function () {}); }
    }
    var input = g.querySelector('#w360-pw'), fl = g.querySelector('.fl'), msg = g.querySelector('.msg'),
        go = g.querySelector('.go'), eye = g.querySelector('.ey2');
    setTimeout(function () { try { input.focus({ preventScroll: true }); } catch (e) {} }, 350);

    eye.addEventListener('click', function () {
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      eye.innerHTML = show ? EYE_OFF : EYE;
      eye.setAttribute('aria-pressed', show ? 'true' : 'false');
      eye.setAttribute('aria-label', show ? 'Hide phrase' : 'Show phrase');
      input.focus();
    });
    input.addEventListener('input', function () { fl.classList.remove('bad'); msg.classList.remove('on'); });

    function digest(str) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      });
    }
    function fail(text) {
      go.classList.remove('busy');
      msg.textContent = text; msg.classList.add('on');
      fl.classList.add('bad'); fl.classList.remove('shake'); void fl.offsetWidth; fl.classList.add('shake');
      input.select();
    }
    g.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) { fail('Enter your access phrase to continue.'); return; }
      go.classList.add('busy');
      digest(SALT + v.toLowerCase()).then(function (h) {
        if (h !== HASH) { setTimeout(function () { fail('That phrase did not match. Check it and try again.'); }, 380); return; }
        try { localStorage.setItem(KEY, JSON.stringify({ h: HASH, t: Date.now() + TTL })); } catch (e2) {}
        if (RM) { root.classList.remove('w360-locked'); g.remove(); return; }
        go.classList.remove('busy'); input.blur();
        g.classList.add('out');
        setTimeout(function () {
          root.classList.remove('w360-locked'); root.classList.add('w360-in');
          g.classList.add('fade');
        }, 1750);
        setTimeout(function () { g.remove(); root.classList.remove('w360-in'); }, 2900);
      }, function () { fail('This browser cannot check the phrase. Try another browser.'); });
    });
  }
  if (document.body) { build(); } else { document.addEventListener('DOMContentLoaded', build); }
})();
