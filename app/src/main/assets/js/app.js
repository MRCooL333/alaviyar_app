"use strict";
/* ============================================================================
   علوی‌یار: برنامه‌ی دانش‌آموزان علوی
   صفحه‌های این فایل با پرتال واقعی (portal.js) کار می‌کنند؛ درخواست‌ها را برنامه‌ی اندروید می‌فرستد.
   ========================================================================== */
const IMG = { mascot: "img/mascot.webp", badge: "img/badge.png" };
const SUPPORT_URL = "https://ble.ir/MRCooL_33";
const APP_VERSION = "1.0.0";

const ICON = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  report: '<rect x="5" y="3.5" width="14" height="17.5" rx="2.5"/><path d="M9 3.5V2h6v1.5"/><path d="M8.5 12.5l2.2 2.2 4.3-4.6"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
  door: '<path d="M10 4H6.5C5.7 4 5 4.7 5 5.5v13c0 .8.7 1.5 1.5 1.5H10"/><path d="M14 8l4 4-4 4"/><path d="M18 12H9"/>',
  exam: '<path d="M6 3h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
  chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h0a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h0a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v0a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  out: '<path d="M10 4H6.5C5.7 4 5 4.7 5 5.5v13c0 .8.7 1.5 1.5 1.5H10"/><path d="M16 8l4 4-4 4"/><path d="M20 12h-9"/>',
  clip: '<path d="M20 12.5l-7.5 7.5a5 5 0 0 1-7-7l8-8a3.4 3.4 0 0 1 5 5l-8 8a1.8 1.8 0 0 1-2.5-2.5l7-7"/>',
  down: '<path d="M12 4v11"/><path d="M7.5 11l4.5 4.5 4.5-4.5"/><path d="M5 20h14"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.6-2.4 2-2.4 3.6"/><path d="M12 17.2h.01"/>',
};
const ic = (n, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- پل اندروید (ذخیره‌ی امن ورود، باز کردن فایل و لینک، رنگ نوار سیستم) ---------- */
const Nat = {
  call(name, ...a) { try { const b = window.AndroidBridge; return b && b[name] ? b[name](...a) : undefined; } catch (e) { return undefined; } },
  saveCreds(nid, pw) { this.call("saveCreds", JSON.stringify({ nid, pw })); },
  loadCreds() { const s = this.call("loadCreds"); try { return s ? JSON.parse(s) : null; } catch (e) { return null; } },
  clearCreds() { this.call("clearCreds"); },
  openUrl(u) { this.call("openUrl", u); },
  openFile(uri, mime) { this.call("openFile", uri, mime || ""); },
  setChrome(top, bottom, lightIcons) { this.call("setChrome", top, bottom, !!lightIcons); },
  exit() { this.call("exitApp"); },
};

/* ---------- حالت برنامه ---------- */
const S = {
  user: null, tab: "home",
  login: { mode: "in", cooldownUntil: 0 },
  rc: { id: null }, an: { a: null, b: null },
  hw: { c: 0, m: 0 }, tr: { w: 0 },
  ex: { lv: null, gr: 0, co: null, page: 1, exam: null },
};
let creds = null;                 // {nid, pw} برای ورود دوباره‌ی خودکار وقتی نشست تمام می‌شود
const $app = document.getElementById("app");
const TABS = [["home", "خانه", "home"], ["rc", "کارنامه", "report"], ["hw", "تکالیف", "book"], ["tr", "تردد", "door"], ["ex", "نمونه سوال", "exam"], ["set", "تنظیمات", "gear"]];
const TITLES = { home: "علوی‌یار", rc: "کارنامه", an: "تحلیل نمرات", hw: "تکالیف", tr: "تردد", ex: "نمونه سوال", set: "تنظیمات" };
const tabIndex = t => Math.max(0, TABS.findIndex(x => x[0] === (t === "an" ? "rc" : t)));

/* ---------- حافظه‌ی موقت (برای کم شدن درخواست به سرور مدرسه) ---------- */
const cache = new Map();
async function cached(key, fn, ttl = 300000) {
  const hit = cache.get(key);
  if (hit && Date.now() < hit.exp) return hit.v;
  const v = await fn();
  cache.set(key, { v, exp: Date.now() + ttl });
  return v;
}
const HOUR = 3600000;

/* ---------- ارتباط با پرتال (با ورود دوباره‌ی خودکار) ---------- */
async function relogin() {
  if (!creds) throw new Portal.SessionExpired("اتصال ذخیره نشده");
  await Portal.login(creds.nid, creds.pw);
}
async function P(fn) {
  try { return await fn(); }
  catch (e) {
    if (e instanceof Portal.SessionExpired && creds) {
      try { await relogin(); } catch (e2) { if (e2 instanceof Portal.LoginFailed) { await forceLogout("گذرواژه‌ات در پرتال عوض شده؛ دوباره وارد شو."); } throw e2; }
      return await fn();
    }
    throw e;
  }
}
function errText(e, fallback) {
  if (e instanceof Portal.LoginFailed || e instanceof Portal.UserNotFound) return e.message;
  if (e && e.message) return e.message;
  return fallback || "مشکلی پیش آمد. دوباره تلاش کن.";
}

/* ---------- تم روز و شب ---------- */
function getTheme() { try { return localStorage.getItem("alavi_theme") || "auto"; } catch (e) { return "auto"; } }
function applyTheme(t) {
  const r = document.documentElement;
  if (t === "light" || t === "dark") r.setAttribute("data-theme", t); else r.removeAttribute("data-theme");
  syncChrome();
}
function setTheme(t) { try { localStorage.setItem("alavi_theme", t); } catch (e) { /* ذخیره نشد؛ فقط تا بستن برنامه می‌ماند */ } applyTheme(t); }
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function toHex(c) {
  if (/^#/.test(c)) return c;
  const m = c.match(/\d+/g); return m ? "#" + m.slice(0, 3).map(x => (+x).toString(16).padStart(2, "0")).join("") : "#064a30";
}
function syncChrome() {
  const hasNav = !!document.getElementById("tabs") && document.getElementById("tabs").style.display !== "none" && !document.querySelector(".login,.splash");
  const bottom = hasNav ? cssVar("--surface") : (document.querySelector(".splash") ? cssVar("--forest") : cssVar("--paper"));
  const hex = toHex(bottom);
  const lum = parseInt(hex.slice(1, 3), 16) * 0.3 + parseInt(hex.slice(3, 5), 16) * 0.59 + parseInt(hex.slice(5, 7), 16) * 0.11;
  Nat.setChrome(toHex(cssVar("--forest")), hex, lum < 128);
}
applyTheme(getTheme());
if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => { if (getTheme() === "auto") syncChrome(); };
  if (mq.addEventListener) mq.addEventListener("change", onChange); else if (mq.addListener) mq.addListener(onChange);
}

/* ---------- پیام کوتاه ---------- */
let toastTimer = 0;
function toast(msg, action) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  if (action) { const b = document.createElement("button"); b.className = "act"; b.textContent = action.label; b.addEventListener("click", () => { t.classList.remove("on"); action.fn(); }); t.appendChild(b); }
  t.classList.add("on"); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("on"), action ? 6000 : 2600);
}

/* ---------- قاب ثابت (نوار بالا + محتوا + نوار پایین) و انیمیشن جابجایی ---------- */
let frameReady = false, pendingDir = null, prevLoading = false, backFn = null, renderTok = 0;
function ensureFrame() {
  if (frameReady && document.getElementById("topbar")) return;
  $app.innerHTML = `<header class="topbar" id="topbar"></header><main id="main" tabindex="-1"></main>
    <nav class="tabs" id="tabs" aria-label="بخش‌ها">${TABS.map(([k, l, i]) => `<button data-tab="${k}">${ic(i)}<span>${l}</span></button>`).join("")}</nav>`;
  frameReady = true;
}
function animate(main, dir) {
  main.classList.remove("enter-fwd", "enter-back", "enter-up", "enter-soft");
  if (!dir) return;
  void main.offsetWidth;                      // دوباره‌شروع شدن انیمیشن
  main.classList.add("enter-" + dir);
}
function shell({ title, back, body, actions = "", loading = false }) {
  ensureFrame();
  const cur = S.tab === "an" ? "rc" : S.tab;
  $("#topbar").innerHTML = `${back ? `<button class="iconbtn" data-act="back" aria-label="بازگشت">${ic("back")}</button>` : `<img class="badge" src="${IMG.badge}" alt="علوی">`}<h1>${esc(title)}</h1>${actions}`;
  const main = $("#main");
  main.innerHTML = body;
  let dir;
  if (loading) dir = pendingDir ? "soft" : null;                 // هنگام بارگذاری فقط محو شدن؛ جهت برای محتوای اصلی می‌ماند
  else { dir = pendingDir || (prevLoading ? "soft" : null); pendingDir = null; }
  prevLoading = loading;
  animate(main, dir);
  document.querySelectorAll("#tabs button").forEach(b => { if (b.dataset.tab === cur) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  $("#tabs").style.display = "";
  syncChrome();
}
const loadingBody = '<div class="loading" role="status"><span class="spin"></span><div>در حال دریافت…</div></div>';
const errBody = (msg, retry = "retry") => `<div class="err" role="alert">${esc(msg)}<div style="margin-top:10px"><button class="btn ghost" data-act="${retry}">دوباره تلاش کن</button></div></div>`;
function go(tab, dir) {
  if (dir === undefined) dir = tabIndex(tab) > tabIndex(S.tab) ? "fwd" : tabIndex(tab) < tabIndex(S.tab) ? "back" : null;
  pendingDir = dir; S.tab = tab; render();
}
function step(dir) { pendingDir = dir || "fwd"; render(); }   // رفتن به مرحله‌ی بعد یا قبل داخل یک بخش
const firstName = n => (n || "").trim().split(/\s+/)[0] || "";

async function render() {
  if (!S.user) return renderLogin();
  const my = ++renderTok;
  const fn = { home: renderHome, rc: renderRC, an: renderAN, hw: renderHW, tr: renderTR, ex: renderEX, set: renderSet }[S.tab] || renderHome;
  try { await fn(() => my === renderTok); }
  catch (e) { if (my === renderTok && !(e instanceof Portal.LoginFailed)) shell({ title: TITLES[S.tab] || "علوی‌یار", back: !!backFn, body: errBody(errText(e, "اتصال به پرتال برقرار نشد.")) }); }
}

/* ---------- ورود ---------- */
function renderSplash(msg) {
  frameReady = false;
  $app.innerHTML = `<div class="splash"><img class="m" src="${IMG.mascot}" alt=""><span class="spin" role="status" aria-label="در حال بارگذاری"></span><p>${esc(msg || "در حال اتصال به پرتال…")}</p></div>`;
  syncChrome();
}
function renderLogin(notice) {
  frameReady = false; backFn = null;
  const L = S.login, inMode = L.mode === "in";
  $app.innerHTML = `
  <div class="login">
    <div class="top"><img class="m" src="${IMG.mascot}" alt="" width="190"><img class="b" src="${IMG.badge}" alt="علوی"></div>
    <div class="sheet">
      <div class="seg" role="tablist">
        <button role="tab" aria-selected="${inMode}" data-act="lmode" data-m="in">ورود به حساب پرتال</button>
        <button role="tab" aria-selected="${!inMode}" data-act="lmode" data-m="pw">دریافت گذرواژه</button>
      </div>
      ${notice ? `<div class="err" role="alert" style="margin:0 0 14px">${esc(notice)}</div>` : ""}
      ${inMode ? `
        <form id="f-in" novalidate>
          <label class="f" for="nid">کد ملی (یا شماره‌ی فراگیر)</label>
          <input class="in" id="nid" inputmode="numeric" autocomplete="username" maxlength="12" placeholder="بدون خط تیره">
          <div class="field-err" id="e-nid"></div>
          <label class="f" for="pw">گذرواژه‌ی پرتال</label>
          <input class="in" id="pw" type="password" autocomplete="current-password" placeholder="گذرواژه‌ای که با پیامک گرفتی">
          <div class="field-err" id="e-pw"></div>
          <button class="btn block" id="b-in" type="submit">ورود به حساب پرتال</button>
        </form>
        <p class="hint" style="text-align:center;margin:14px 0 0">گذرواژه را نداری یا فراموش کرده‌ای؟ از تب «دریافت گذرواژه» پیامکش کن.</p>`
      : `
        <form id="f-pw" novalidate>
          <label class="f" for="nid2">کد ملی (یا شماره‌ی فراگیر)</label>
          <input class="in" id="nid2" inputmode="numeric" maxlength="12" placeholder="بدون خط تیره">
          <div class="field-err" id="e-nid2"></div>
          <label class="f" for="mob">شماره‌ی همراهِ ثبت‌شده در مدرسه</label>
          <input class="in" id="mob" inputmode="numeric" maxlength="11" placeholder="09123456789">
          <div class="field-err" id="e-mob"></div>
          <button class="btn block" id="b-pw" type="submit">دریافت گذرواژه با پیامک</button>
          <div id="pw-res" role="status"></div>
        </form>`}
    </div>
  </div>`;
  if (!inMode) tickCooldown();
  syncChrome();
}
function tickCooldown() {
  const b = $("#b-pw"); if (!b) return;
  const left = Math.ceil((S.login.cooldownUntil - Date.now()) / 1000);
  if (left > 0) { b.disabled = true; b.textContent = `${N(left)} ثانیه صبر کن تا دوباره بفرستی`; setTimeout(tickCooldown, 500); }
  else { b.disabled = false; b.textContent = "دریافت گذرواژه با پیامک"; }
}
const setErr = (id, msg) => { const e = $("#e-" + id), i = $("#" + id); if (e) e.textContent = msg || ""; if (i) i.classList.toggle("bad", !!msg); };
async function enter(user, nid, pw) {
  S.user = user; creds = { nid, pw }; cache.clear();
  S.tab = "home"; S.rc.id = null; S.an = { a: null, b: null }; S.hw = { c: 0, m: 0 }; S.tr = { w: 0 };
  S.ex = { lv: null, gr: 0, co: null, page: 1, exam: null };
  pendingDir = "up"; render();
}
async function submitLogin() {
  const nid = toEn($("#nid").value.trim()), pw = $("#pw").value;
  const okN = /^\d{10}$/.test(nid);
  setErr("nid", okN ? "" : "کد ملی باید ۱۰ رقم باشد."); setErr("pw", pw ? "" : "گذرواژه را بنویس.");
  if (!okN || !pw) return;
  const b = $("#b-in"); b.disabled = true; b.textContent = "در حال ورود…";
  try {
    const user = await Portal.login(nid, pw);
    Nat.saveCreds(nid, pw);
    await enter(user, nid, pw);
    toast("با موفقیت وصل شدی ✅");
  } catch (e) {
    const bb = $("#b-in"); if (bb) { bb.disabled = false; bb.textContent = "ورود به حساب پرتال"; }
    setErr("pw", e instanceof Portal.LoginFailed ? e.message : errText(e, "اتصال به پرتال برقرار نشد."));
  }
}
async function submitPw() {
  const nid = toEn($("#nid2").value.trim()), mob = toEn($("#mob").value.replace(/\s/g, ""));
  const okN = /^\d{10}$/.test(nid), okM = /^09\d{9}$/.test(mob);
  setErr("nid2", okN ? "" : "کد ملی باید ۱۰ رقم باشد."); setErr("mob", okM ? "" : "شماره باید با ۰۹ شروع شود و ۱۱ رقم باشد.");
  if (!okN || !okM) return;
  const b = $("#b-pw"), res = $("#pw-res"); b.disabled = true; b.textContent = "در حال ارسال…"; res.innerHTML = "";
  try {
    await Portal.requestPassword(nid, mob);
    S.login.cooldownUntil = Date.now() + 120000; tickCooldown();
    res.innerHTML = `<div class="okbox">درخواست ارسال شد. تا لحظاتی دیگر پیامکی حاوی گذرواژه برایت می‌آید.<br>
      بعد از دریافتش، برو به «ورود به حساب پرتال» و با همان گذرواژه وارد شو.
      <div style="margin-top:10px"><button type="button" class="btn ghost" data-act="lmode" data-m="in">رفتن به ورود</button></div></div>`;
  } catch (e) {
    b.disabled = false; b.textContent = "دریافت گذرواژه با پیامک";
    res.innerHTML = e instanceof Portal.UserNotFound
      ? `<div class="err" role="alert" style="margin:14px 0 0">اطلاعات واردشده در پرتال یافت نشد. کد ملی یا شماره‌ی همراه اشتباه است، یا شماره در مدرسه ثبت نشده. با واحدی که مشخصات تو را ثبت کرده تماس بگیر.</div>`
      : `<div class="err" role="alert" style="margin:14px 0 0">ارسال درخواست به پرتال انجام نشد. کمی بعد دوباره تلاش کن.</div>`;
  }
}
async function forceLogout(notice) {
  Nat.clearCreds(); creds = null; Portal.forget(); S.user = null; cache.clear(); frameReady = false;
  S.an = { a: null, b: null }; S.rc.id = null; S.login.mode = "in";
  renderLogin(notice);
}

/* ---------- خانه ---------- */
const cardOf = url => cached("card:" + url, () => Portal.reportCard(url));
const reportItems = () => cached("rc-list", () => Portal.reportList());
const mainTotal = c => c.totals.find(t => normName(t.name) === "کل") || c.totals[0];
async function renderHome(alive) {
  backFn = null;
  shell({ title: "علوی‌یار", body: `
    <section class="hero"><div class="say"><p class="hi">سلام ${esc(firstName(S.user.name))} 👋</p><div class="bubble" id="say">از هر بخشی که می‌خوای شروع کن 👇</div></div>
      <img src="${IMG.mascot}" alt="" width="128"></section>
    <div id="latest-wrap"><h2 class="sectitle">آخرین کارنامه</h2><div class="skel" aria-hidden="true"></div></div>
    <h2 class="sectitle">بخش‌ها</h2>
    <div class="rows">
      ${[["rc", "report", "کارنامه", "نمره، تراز و رتبه‌ی هر آزمون"], ["hw", "book", "تکالیف", "فعالیت‌ها و فایل‌های دبیر"],
         ["tr", "door", "تردد", "ساعت ورود و خروج هفته‌به‌هفته"], ["ex", "exam", "نمونه سوال", "پرسش و پاسخ آزمون‌های قبلی"]]
        .map(([k, i, n, d]) => `<button class="row" data-tab="${k}"><span class="ic">${ic(i)}</span><span class="tx"><b>${n}</b><span>${d}</span></span><span class="chev">${ic("chev")}</span></button>`).join("")}
      <button class="row accent" data-act="an-start"><span class="ic">${ic("chart")}</span><span class="tx"><b>تحلیل نمرات</b><span>دو آزمون را مقایسه کن و توصیه بگیر</span></span><span class="chev">${ic("chev")}</span></button>
    </div>` });
  const wrap = $("#latest-wrap");
  try {
    const items = await P(reportItems); if (!alive()) return;
    if (!items.length) { wrap.innerHTML = ""; return; }
    const last = await P(() => cardOf(items[0].url)); if (!alive()) return;
    const t = mainTotal(last);
    if (t) {
      wrap.innerHTML = `<h2 class="sectitle">آخرین کارنامه</h2>
        <button class="latest" data-act="rc-open" data-id="0">
          <div><div class="num">${F(num(t.score))}</div><div class="of">از ${N(cardScale(last))}</div></div>
          <div class="meta"><b>${esc(last.title)}</b><span class="hint">رتبه‌ی ${N(num(t.rank) == null ? "—" : num(t.rank))} · تراز ${N(num(t.std) == null ? "—" : num(t.std))}</span></div>
          <span class="chev" style="transform:scaleX(-1);color:var(--muted)">${ic("chev")}</span></button>`;
    } else wrap.innerHTML = "";
    if (items.length > 1) {
      const prev = await P(() => cardOf(items[1].url)); if (!alive()) return;
      const c = compare(last, prev), d = c.totals.find(x => normName(x.name) === "کل") || c.totals[0];
      const say = d && ({
        up: `آزمون آخرت از قبلی بهتر بود! حدود ${F(d.d)} ${cardScale(last) === 100 ? "درصد" : "نمره"} بالاتر اومدی 🔥`,
        down: "آزمون آخرت یه کم از قبلی پایین‌تر بود. بیا با هم ببینیم کجا افتاد 💪",
        flat: "نمره‌ی آزمون آخرت تقریباً مثل قبلیه؛ ریتمت خوبه ⚖️",
      })[d.st];
      const el = $("#say"); if (say && el) el.textContent = say;
    }
  } catch (e) { if (alive() && !(e instanceof Portal.LoginFailed)) wrap.innerHTML = `<h2 class="sectitle">آخرین کارنامه</h2><div class="err" role="alert">${esc(errText(e, "کارنامه دریافت نشد."))}<div style="margin-top:10px"><button class="btn ghost" data-act="retry">دوباره تلاش کن</button></div></div>`; }
}

/* ---------- کارنامه ---------- */
async function renderRC(alive) {
  if (S.rc.id != null) return renderRCDetail(alive);
  backFn = null;
  shell({ title: TITLES.rc, body: loadingBody, loading: true });
  const items = await P(reportItems); if (!alive()) return;
  if (!items.length) return shell({ title: TITLES.rc, body: '<div class="empty">کارنامه‌ای پیدا نشد.</div>' });
  let year = null, html = `<div class="pad" style="padding-bottom:0"><button class="btn block" data-act="an-start">${ic("chart")} تحلیل نمرات: مقایسه‌ی دو آزمون</button></div>`;
  items.forEach((r, i) => {
    if (r.year !== year) { year = r.year; html += `<h2 class="yeartitle">${esc(r.year)}</h2>`; }
    html += `<button class="rc-item" data-act="rc-open" data-id="${i}"><span class="t">${esc(r.title)}</span><span class="chev" style="color:var(--muted);transform:scaleX(-1)">${ic("chev")}</span></button>`;
  });
  shell({ title: TITLES.rc, body: html });
}
async function renderRCDetail(alive) {
  backFn = () => { S.rc.id = null; step("back"); };
  shell({ title: "کارنامه", back: true, body: loadingBody, loading: true });
  const items = await P(reportItems); if (!alive()) return;
  const it = items[S.rc.id];
  if (!it) { S.rc.id = null; return render(); }
  const r = await P(() => cardOf(it.url)); if (!alive()) return;
  const sc = cardScale(r);
  const stat = t => `<div class="stat"><div class="k">${esc(t.name)}</div><div class="v">${F(num(t.score))}</div><div class="sub">رتبه ${num(t.rank) == null ? "—" : N(num(t.rank))} · تراز ${num(t.std) == null ? "—" : N(num(t.std))}</div></div>`;
  const les = r.lessons.map(l => {
    const s = num(l.score), g = num(l.groupAvg);
    return `<div class="lesson"><div class="h"><b>${esc(l.name)}</b><span class="sc">${F(s)}</span></div>
      <div class="gauge" role="img" aria-label="${esc(l.name)}: ${F(s)} از ${N(sc)}"><i style="width:${Math.min(100, Math.max(0, s || 0) / sc * 100)}%"></i>${g != null ? `<u style="right:calc(${Math.min(100, Math.max(0, g) / sc * 100)}% - 1px)" title="میانگین گروه"></u>` : ""}</div>
      <div class="m">${l.rank ? `<span>رتبه ${N(num(l.rank))}</span>` : ""}${l.stdScore ? `<span>تراز ${N(num(l.stdScore))}</span>` : ""}${g != null ? `<span>میانگین گروه ${F(g)}</span>` : ""}
      ${l.correct || l.wrong || l.blank ? `<span>✅ ${N(l.correct || 0)} ❌ ${N(l.wrong || 0)} ⚪ ${N(l.blank || 0)}</span>` : ""}</div></div>`;
  }).join("");
  shell({ title: "کارنامه", back: true, body: `
    <div class="lead">${esc(r.title)}</div>
    ${r.totals.length ? `<div class="stats" style="margin-top:8px">${r.totals.map(stat).join("")}</div>` : ""}
    ${les ? `<h2 class="sectitle">درس‌ها <span class="hint">(خط قرمز = میانگین گروه)</span></h2>${les}` : ""}
    <div class="pad"><button class="btn block" data-act="an-from" data-id="${S.rc.id}">${ic("chart")} تحلیل این آزمون</button></div>` });
}

/* ---------- تحلیل نمرات ---------- */
async function renderAN(alive) {
  const A = S.an;
  backFn = () => { if (A.b != null) A.b = null; else if (A.a != null) A.a = null; else { go("home", "back"); return; } step("back"); };
  shell({ title: TITLES.an, back: true, body: loadingBody, loading: true });
  const items = await P(reportItems); if (!alive()) return;
  if (items.length < 2) return shell({ title: TITLES.an, back: true, body: '<div class="empty">برای تحلیل حداقل به دو کارنامه نیاز است.</div>' });
  const pick = (act, skip) => items.map((r, i) => i === skip ? "" : `<button class="rc-item" data-act="${act}" data-id="${i}"><span class="t">${esc(r.title)}<small class="hint" style="display:block;font-weight:400">${esc(r.year)}</small></span><span class="chev" style="color:var(--muted);transform:scaleX(-1)">${ic("chev")}</span></button>`).join("");
  if (A.a == null) return shell({ title: TITLES.an, back: true, body: `<p class="lead">آزمون مدنظرت را انتخاب کن</p>${pick("an-a", -1)}` });
  if (A.b == null) return shell({ title: TITLES.an, back: true, body: `<div class="cmp-head"><div><small>آزمون اصلی</small><b>${esc(items[A.a].title)}</b></div></div><p class="lead">با کدام آزمون مقایسه کنم؟</p>${pick("an-b", A.a)}` });
  shell({ title: TITLES.an, back: true, body: loadingBody, loading: true });
  const ca = await P(() => cardOf(items[A.a].url)); if (!alive()) return;
  const cb = await P(() => cardOf(items[A.b].url)); if (!alive()) return;
  const c = compare(ca, cb), unit = c.scale === 100 ? "درصد" : "نمره";
  const pill = (st, t) => `<span class="pill ${st}">${STATUS_TXT[st][0]} ${t}</span>`;
  const dtxt = d => `${d > 0 ? "+" : ""}${F(d)} ${unit}`;
  const tot = c.totals.map(t => `<div class="stat"><div class="k">${esc(t.name)}</div><div class="v">${F(t.a)}</div>
    <div class="sub">مقایسه: ${F(t.b)}</div><div style="margin-top:4px">${pill(t.st, dtxt(t.d))}</div>
    ${t.rank ? `<div class="sub" style="margin-top:4px">${t.rank.diff > 0 ? "⬆️" : t.rank.diff < 0 ? "⬇️" : "➖"} رتبه ${N(t.rank.a)} (${N(t.rank.b)})</div>` : ""}</div>`).join("");
  const rowsH = c.rows.map(r => `<div class="crow"><div class="top"><b>${esc(r.l.name)}</b>${pill(r.st, STATUS_TXT[r.st][1] + ": " + dtxt(r.d) + pctChange(r.a, r.b))}</div>
    <div class="vals"><span>اصلی <b style="color:var(--ink)">${F(r.a)}</b></span><span>مقایسه ${F(r.b)}</span>
    ${r.rank ? `<span>🏅 رتبه ${N(r.rank.a)} (${N(r.rank.b)}) · ${r.rank.txt}</span>` : ""}
    ${r.grp ? `<span>👥 ${{ above: "بالاتر از", below: "پایین‌تر از", same: "هم‌سطح" }[r.grp]} میانگین گروه (${F(r.ga)})</span>` : ""}
    ${r.l.correct || r.l.wrong || r.l.blank ? `<span>✅ ${N(r.l.correct || 0)} ❌ ${N(r.l.wrong || 0)} ⚪ ${N(r.l.blank || 0)}</span>` : ""}</div></div>`).join("");
  const adv = c.advice.map(p => typeof p === "string" ? `<p>${esc(p).replace(/\n/g, "<br>")}</p>` : `<p class="small">${esc(p.small)}</p>`).join("");
  shell({ title: TITLES.an, back: true, body: `
    <div class="cmp-head"><div><small>آزمون اصلی</small><b>${esc(c.aTitle)}</b></div><div><small>مقایسه با</small><b>${esc(c.bTitle)}</b></div></div>
    ${c.note ? `<div class="note" style="margin:12px 16px 0">ℹ️ ${esc(c.note)}</div>` : ""}
    ${c.totals.length ? `<h2 class="sectitle">وضعیت کلی</h2><div class="tile3">${tot}</div>` : ""}
    ${c.rows.length ? `<h2 class="sectitle">مقایسه‌ی درس‌ها</h2>${rowsH}
    <div class="counts">${pill("up", N(c.up.length) + " درس پیشرفت")} ${pill("flat", N(c.flat.length) + " درس ثابت")} ${pill("down", N(c.down.length) + " درس افت")}</div>` : '<div class="empty">این دو آزمون درس مشترکی ندارند.</div>'}
    ${c.onlyA.length || c.onlyB.length ? `<p class="hint" style="padding:10px 16px 0">${c.onlyA.length ? "ℹ️ فقط در آزمون اصلی: " + esc(c.onlyA.join("، ")) + "<br>" : ""}${c.onlyB.length ? "ℹ️ فقط در آزمون مقایسه: " + esc(c.onlyB.join("، ")) : ""}</p>` : ""}
    <div class="coach"><div class="bubble">${adv}</div><img src="${IMG.mascot}" alt=""></div>
    <div class="actions"><button class="btn block" data-act="an-swap">${ic("chart")} مقایسه با آزمون دیگر</button><button class="btn ghost block" data-act="an-reset">انتخاب آزمون اصلیِ دیگر</button></div>` });
}

/* ---------- تنظیمات ---------- */
async function renderSet() {
  backFn = null;
  const u = S.user, th = getTheme();
  const avatar = u.photo ? `<div class="avatar"><img src="${esc(u.photo)}" alt="عکس ${esc(u.name)}"></div>` : `<div class="avatar fallback"><img src="${IMG.mascot}" alt=""></div>`;
  shell({ title: TITLES.set, body: `
    <section class="profile">${avatar}<h2>${esc(u.name || "دانش‌آموز")}</h2><small>دانش‌آموز علوی</small></section>
    <div class="setgroup"><h3>ظاهر برنامه</h3>
      <div class="seg3" role="group" aria-label="حالت روز و شب">
        <button data-act="theme" data-t="light" aria-pressed="${th === "light"}"><span class="em">☀️</span>روز</button>
        <button data-act="theme" data-t="dark" aria-pressed="${th === "dark"}"><span class="em">🌙</span>شب</button>
        <button data-act="theme" data-t="auto" aria-pressed="${th === "auto"}"><span class="em">📱</span>مثل گوشی</button>
      </div></div>
    <div class="setgroup"><h3>کمک</h3>
      <button class="setbtn" data-act="support"><span class="ic">${ic("help")}</span><span style="flex:1">پشتیبانی<small>گفتگو با پشتیبان در بله</small></span></button></div>
    <div class="setgroup"><h3>حساب</h3>
      <button class="setbtn danger" data-act="logout"><span class="ic">${ic("out")}</span><span style="flex:1">خروج از حساب<small>اطلاعات ورودت از این گوشی پاک می‌شود</small></span></button></div>
    <p class="ver">علوی‌یار · نسخه‌ی ${N(APP_VERSION)}</p>` });
}

/* ---------- دریافت فایل (مستقیم از سرور پرتال روی گوشی) ---------- */
async function downloadOne(url) {
  const r = await P(() => Portal.download(url));
  return r;
}
async function doDownload(urls, el, label) {
  if (el) el.classList.add("busy");
  toast(urls.length > 1 ? "در حال دریافت فایل‌ها…" : "در حال دریافت فایل…");
  try {
    let last = null;
    for (const u of urls) last = await downloadOne(u);
    if (urls.length === 1) toast(`«${last.name}» در پوشه‌ی دانلودها ذخیره شد`, { label: "باز کردن", fn: () => Nat.openFile(last.uri, last.mime) });
    else toast(`${N(urls.length)} فایل در پوشه‌ی دانلودها ذخیره شد`, { label: "باز کردن آخری", fn: () => Nat.openFile(last.uri, last.mime) });
  } catch (e) {
    toast(e instanceof Portal.PortalError && e.message ? e.message : "دریافت فایل ممکن نشد. دوباره تلاش کن.");
  } finally { if (el) el.classList.remove("busy"); }
}

/* ---------- تکالیف ---------- */
const shortClass = t => (t.split("؛").pop().trim() || t);
const year4 = t => { const m = toEn(t).match(/\d{4}/); return m ? m[0] : t; };
const monthLabel = t => { const m = toEn(t).trim().match(/^(.+?)\s+(\d{2})$/); return m ? `${m[1]} 14${m[2]}` : t; };
const HW_ICON = { "فعالیت": "🌱", "تکلیف": "✏️" };
function hwLessonsHtml(page) {
  if (!page.lessons.length) return '<div class="hint" style="padding:6px 0 10px">برای این روز فعالیت یا تکلیفی ثبت نشده.</div>';
  return page.lessons.map(l => `<div class="ln"><b>${esc(l.name)}</b>${l.teacher ? `<p class="teacher">👤 ${esc(l.teacher)}</p>` : ""}
    ${l.items.map(it => it.text
      ? `<div class="it"><span class="lab">${HW_ICON[it.label] || "📌"} ${esc(it.label)}</span><br>${esc(it.text)}</div>`
      : `<div class="it"><span class="lab">📎 ${esc(it.label)}</span><br>${it.files.map((u, k) => `<button class="file" data-act="file" data-url="${esc(u)}">${ic("down")}<span>دریافت فایل${it.files.length > 1 ? " " + N(k + 1) : ""}</span></button>`).join("")}</div>`).join("")}</div>`).join("");
}
async function renderHW(alive) {
  backFn = null; shell({ title: TITLES.hw, body: loadingBody, loading: true });
  const classes = await P(() => cached("hw-classes", () => Portal.hwClasses())); if (!alive()) return;
  if (!classes.length) return shell({ title: TITLES.hw, body: '<div class="empty">برای تو کلاسی در بخش تکالیف پیدا نشد.</div>' });
  const H = S.hw; H.c = Math.min(H.c, classes.length - 1); const cls = classes[H.c];
  const months = await P(() => cached("hw-months:" + cls.url, () => Portal.hwMonths(cls.url))); if (!alive()) return;
  const clsChips = classes.length > 1 ? `<div class="chips" role="group" aria-label="کلاس">${classes.map((c, i) => `<button class="chip" data-act="hw-c" data-i="${i}" aria-pressed="${i === H.c}">${esc(year4(c.year))} | ${esc(shortClass(c.title))}</button>`).join("")}</div>` : "";
  if (!months.length) return shell({ title: TITLES.hw, body: `${clsChips}<div class="empty">هنوز تکلیفی برای این کلاس ثبت نشده.</div>` });
  H.m = Math.min(H.m, months.length - 1); const mo = months[H.m];
  const days = mo.days.map((d, i) => `<details class="day" data-url="${esc(d.url)}"><summary>${esc(d.title)}<span class="chev">${ic("chev")}</span></summary><div class="hwl"></div></details>`).join("");
  shell({ title: TITLES.hw, body: `${clsChips}
    <div class="chips" style="${classes.length > 1 ? "padding-top:0" : ""}" role="group" aria-label="ماه">${months.map((m, i) => `<button class="chip" data-act="hw-m" data-i="${i}" aria-pressed="${i === H.m}">${esc(monthLabel(m.title))}</button>`).join("")}</div>
    ${days}` });
}
document.addEventListener("toggle", async e => {
  const d = e.target;
  if (!(d instanceof HTMLDetailsElement) || !d.classList.contains("day") || !d.open || d.dataset.loaded) return;
  d.dataset.loaded = "1";
  const box = d.querySelector(".hwl"), url = d.dataset.url;
  box.innerHTML = '<div class="inline-load"><span class="spin"></span>در حال دریافت…</div>';
  try {
    const page = await P(() => cached("hw-day:" + url, () => Portal.hwDay(url)));
    box.innerHTML = (page.date ? `<div class="hint" style="padding:2px 0 6px">📅 ${esc(page.date)}</div>` : "") + hwLessonsHtml(page);
  } catch (err) {
    delete d.dataset.loaded;
    box.innerHTML = `<div class="err" style="margin:6px 0">${esc(errText(err, "دریافت نشد."))}</div><button class="btn ghost" data-act="hw-retry">دوباره تلاش کن</button>`;
  }
}, true);

/* ---------- تردد ---------- */
async function renderTR(alive) {
  backFn = null; shell({ title: TITLES.tr, body: loadingBody, loading: true });
  const ws = await P(() => cached("traffic", () => Portal.trafficWeeks())); if (!alive()) return;
  if (!ws.length) return shell({ title: TITLES.tr, body: '<div class="empty">برای تو هنوز تردد ثبت نشده.</div>' });
  const T = S.tr; T.w = Math.min(T.w, ws.length - 1); const w = ws[T.w];
  const present = w.days.filter(d => d.entry || d.exit).length, noExit = w.days.filter(d => d.entry && !d.exit).length;
  const cell = (cls, t) => t ? `<span class="tm"><i class="dot ${cls}"></i>${cls === "in" ? "ورود" : "خروج"} ${N(t)}</span>` : `<span class="tm miss"><i class="dot"></i>ثبت نشده</span>`;
  const multi = new Set(w.days.map(d => d.school)).size > 1;
  let last = null, rows = "";
  if (!multi && w.days[0].school) rows += `<div class="crumb" style="padding-bottom:8px">🏫 ${esc(w.days[0].school)}</div>`;
  w.days.forEach(d => {
    if (multi && d.school !== last) { rows += `<div class="crumb" style="padding-bottom:8px">🏫 ${esc(d.school)}</div>`; last = d.school; }
    rows += `<div class="tr-day"><div class="d">${esc(d.weekday)} <small>${N(d.date)}</small></div>${cell("in", d.entry)}${cell("out", d.exit)}</div>`;
  });
  shell({ title: TITLES.tr, body: `
    <div class="chips" role="group" aria-label="هفته">${ws.map((x, i) => `<button class="chip" data-act="tr-w" data-i="${i}" aria-pressed="${i === T.w}">${esc(x.title)}</button>`).join("")}</div>
    <div class="sumline"><span>روز حاضر <b>${N(present)}</b></span><span>خروج ثبت‌نشده <b>${N(noExit)}</b></span></div>${rows}` });
}

/* ---------- نمونه سوال ---------- */
async function renderEX(alive) {
  const X = S.ex;
  backFn = X.exam != null ? () => { X.exam = null; step("back"); } : X.co != null ? () => { X.co = null; X.page = 1; step("back"); } : X.lv != null ? () => { X.lv = null; X.gr = 0; step("back"); } : null;
  const title = X.exam != null ? "پرسش و پاسخ" : TITLES.ex;
  if (X.lv == null) {
    return shell({ title, body: `<p class="lead">مقطع را انتخاب کن</p><div class="rows" style="margin-top:8px">${Portal.EXAM_LEVELS.map(([name], i) => `<button class="row" data-act="ex-lv" data-i="${i}"><span class="ic">${ic("book")}</span><span class="tx"><b>${esc(name)}</b></span><span class="chev">${ic("chev")}</span></button>`).join("")}</div>` });
  }
  shell({ title, back: true, body: loadingBody, loading: true });
  const [lvName, slug] = Portal.EXAM_LEVELS[X.lv];
  const grades = await P(() => cached("eg:" + slug, () => Portal.examGrades(slug), HOUR)); if (!alive()) return;
  if (!grades.length) return shell({ title, back: true, body: '<div class="empty">برای این مقطع نمونه سوالی پیدا نشد.</div>' });
  X.gr = Math.min(X.gr, grades.length - 1); const g = grades[X.gr];
  if (X.co == null) {
    return shell({ title, back: true, body: `
      <div class="crumb">${esc(lvName)}</div>
      <div class="chips" role="group" aria-label="پایه">${grades.map((x, i) => `<button class="chip" data-act="ex-gr" data-i="${i}" aria-pressed="${i === X.gr}">${esc(x.title)}</button>`).join("")}</div>
      <p class="lead" style="padding-top:0">درس را انتخاب کن</p>
      <div class="rows">${g.courses.map((c, i) => `<button class="row" data-act="ex-co" data-i="${i}"><span class="tx"><b>${esc(c.title)}</b></span><span class="chev">${ic("chev")}</span></button>`).join("")}</div>` });
  }
  const course = g.courses[X.co]; if (!course) { X.co = null; return render(); }
  const lst = await P(() => cached(`el:${course.url}:${X.page}`, () => Portal.examList(course.url, X.page), HOUR)); if (!alive()) return;
  if (X.page > Math.max(lst.pages, 1)) { X.page = 1; return render(); }
  if (X.exam == null) {
    return shell({ title, back: true, body: `
      <div class="crumb">${esc(lvName)} · ${esc(g.title)} · ${esc(course.title)}</div>
      <div class="rows" style="margin-top:8px">${lst.exams.map((e, i) => `<button class="row" data-act="ex-open" data-i="${i}"><span class="tx"><b>${esc(e.title)}</b><span>${[e.kind, e.count ? N(e.count) + " پرسش" : "", e.code ? "کد " + N(e.code) : ""].filter(Boolean).map(esc).join(" · ")}</span></span><span class="chev">${ic("chev")}</span></button>`).join("") || '<div class="empty">آزمونی ثبت نشده.</div>'}</div>
      <div class="pager"><button class="btn ghost" data-act="ex-pg" data-d="1" ${X.page >= lst.pages ? "disabled" : ""}>صفحه‌ی بعد</button>
        <span class="hint">صفحه‌ی ${N(X.page)} از ${N(lst.pages)}</span>
        <button class="btn ghost" data-act="ex-pg" data-d="-1" ${X.page <= 1 ? "disabled" : ""}>قبلی</button></div>` });
  }
  const it = lst.exams[X.exam]; if (!it) { X.exam = null; return render(); }
  shell({ title, back: true, body: loadingBody, loading: true });
  const pg = await P(() => cached("ep:" + it.url, () => Portal.examPage(it.url), HOUR)); if (!alive()) return;
  const urls = pg.files.map(f => f.url);
  shell({ title, back: true, body: `
    <div class="exam-hd"><h2>${esc(pg.title || it.title)}</h2><div class="kv">${pg.kind || it.kind ? `<span class="pill plain">${esc(pg.kind || it.kind)}</span>` : ""}${pg.total ? `<span class="pill plain">نمره‌ی کل ${N(pg.total)}</span>` : ""}${it.count ? `<span class="pill plain">${N(it.count)} پرسش</span>` : ""}${it.code ? `<span class="pill plain">کد ${N(it.code)}</span>` : ""}</div></div>
    <div class="actions">${pg.files.length
      ? pg.files.map((f, i) => `<button class="btn ${i ? "ghost " : ""}block" data-act="dl" data-urls='${esc(JSON.stringify([f.url]))}'>${ic("down")} دریافت ${esc(f.label)}</button>`).join("") +
        (pg.files.length > 1 ? `<button class="btn ghost block" data-act="dl" data-urls='${esc(JSON.stringify(urls))}'>${ic("down")} هر دو فایل</button>` : "")
      : '<div class="empty">فایلی برای این مورد ثبت نشده.</div>'}</div>` });
}

/* ============================================================================
   رویدادها (واگذاری رویداد از یک نقطه)
   ========================================================================== */
const ACT = {
  back() { if (backFn) backFn(); else go("home", "back"); },
  retry() { cache.clear(); render(); },
  "hw-retry"() { render(); },
  lmode(el) { S.login.mode = el.dataset.m; renderLogin(); },
  theme(el) { setTheme(el.dataset.t); renderSet(); },
  support() { if (window.AndroidBridge) Nat.openUrl(SUPPORT_URL); else window.open(SUPPORT_URL, "_blank"); },
  logout() {
    const d = document.createElement("dialog");
    d.innerHTML = `<h3>خروج از حساب</h3><p class="hint" style="margin:0">اطلاعات ورودت از این گوشی پاک می‌شود. هر وقت خواستی دوباره وارد می‌شوی.</p>
      <div class="acts"><button class="btn red" value="ok">خروج از حساب</button><button class="btn ghost" value="cancel">ماندن</button></div>`;
    document.body.appendChild(d);
    d.addEventListener("click", e => { const b = e.target.closest("button"); if (b) d.close(b.value); });
    d.addEventListener("close", () => { const ok = d.returnValue === "ok"; d.remove(); if (ok) forceLogout(); });
    d.showModal();
  },
  "rc-open"(el) { S.tab = "rc"; S.rc.id = +el.dataset.id; step("fwd"); },
  "an-start"() { S.tab = "an"; S.an = { a: null, b: null }; step("fwd"); },
  "an-from"(el) { S.tab = "an"; S.an = { a: +el.dataset.id, b: null }; step("fwd"); },
  "an-a"(el) { S.an.a = +el.dataset.id; step("fwd"); },
  "an-b"(el) { S.an.b = +el.dataset.id; step("fwd"); },
  "an-swap"() { S.an.b = null; step("back"); },
  "an-reset"() { S.an = { a: null, b: null }; step("back"); },
  "hw-c"(el) { S.hw.c = +el.dataset.i; S.hw.m = 0; pendingDir = "soft"; render(); },
  "hw-m"(el) { S.hw.m = +el.dataset.i; pendingDir = "soft"; render(); },
  "tr-w"(el) { S.tr.w = +el.dataset.i; pendingDir = "soft"; render(); },
  file(el) { doDownload([el.dataset.url], el); },
  dl(el) { try { doDownload(JSON.parse(el.dataset.urls), el); } catch (e) { toast("دریافت فایل ممکن نشد."); } },
  "ex-lv"(el) { S.ex = { lv: +el.dataset.i, gr: 0, co: null, page: 1, exam: null }; step("fwd"); },
  "ex-gr"(el) { S.ex.gr = +el.dataset.i; pendingDir = "soft"; render(); },
  "ex-co"(el) { S.ex.co = +el.dataset.i; S.ex.page = 1; step("fwd"); },
  "ex-pg"(el) { S.ex.page = Math.max(1, S.ex.page + +el.dataset.d); step(+el.dataset.d > 0 ? "fwd" : "back"); },
  "ex-open"(el) { S.ex.exam = +el.dataset.i; step("fwd"); },
};
$app.addEventListener("click", e => {
  const tb = e.target.closest("[data-tab]");
  if (tb) { const k = tb.dataset.tab; if (k === "rc") S.rc.id = null; S.an = { a: null, b: null }; return go(k); }
  const a = e.target.closest("[data-act]"); if (a && ACT[a.dataset.act]) ACT[a.dataset.act](a);
});
$app.addEventListener("submit", e => { e.preventDefault(); if (e.target.id === "f-in") submitLogin(); if (e.target.id === "f-pw") submitPw(); });

/* دکمه‌ی بازگشت گوشی */
window.__back = function () {
  const dlg = document.querySelector("dialog[open]"); if (dlg) { dlg.close("cancel"); return true; }
  if (!S.user) { if (S.login.mode === "pw") { S.login.mode = "in"; renderLogin(); return true; } return false; }
  if (backFn) { backFn(); return true; }
  if (S.tab !== "home") { go("home", "back"); return true; }
  return false;
};

/* ---------- شروع ---------- */
function renderBootError(e) {
  frameReady = false;
  $app.innerHTML = `<div class="splash"><img class="m" src="${IMG.mascot}" alt=""><p>${esc(errText(e, "اتصال به پرتال برقرار نشد."))}</p>
    <button class="btn" style="background:#fff;color:#064a30" data-act="boot">دوباره تلاش کن</button>
    <button class="btn ghost" style="color:#fff;border-color:#fff" data-act="boot-other">ورود با حساب دیگر</button></div>`;
  syncChrome();
}
ACT.boot = () => boot();
ACT["boot-other"] = () => forceLogout();
async function boot() {
  const saved = Nat.loadCreds();
  if (!saved || !saved.nid || !saved.pw) return renderLogin();
  renderSplash();
  try { const user = await Portal.login(saved.nid, saved.pw); await enter(user, saved.nid, saved.pw); }
  catch (e) {
    if (e instanceof Portal.LoginFailed) { Nat.clearCreds(); renderLogin("گذرواژه‌ات در پرتال عوض شده؛ دوباره وارد شو."); }
    else renderBootError(e);
  }
}
boot();
