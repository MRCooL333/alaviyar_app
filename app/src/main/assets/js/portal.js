"use strict";
/* ============================================================================
   اتصال به پرتال p.alavi.ir
   همان کاری را می‌کند که بات بله می‌کند (فایل portal.py): درخواست می‌فرستد و HTML را می‌خواند.
   درخواست‌ها را برنامه‌ی اندروید (AndroidBridge) می‌فرستد، چون صفحه‌ی وب اجازه‌ی
   درخواست مستقیم به پرتال را ندارد.
   ========================================================================== */
(function (global) {
  const BASE = "https://p.alavi.ir";

  class PortalError extends Error { constructor(m) { super(m); this.name = "PortalError"; } }
  class LoginFailed extends PortalError { constructor(m) { super(m); this.name = "LoginFailed"; } }
  class SessionExpired extends PortalError { constructor(m) { super(m); this.name = "SessionExpired"; } }
  class UserNotFound extends PortalError { constructor(m) { super(m); this.name = "UserNotFound"; } }

  /* ---------- پل به برنامه‌ی اندروید ---------- */
  const pending = new Map();
  let seq = 0;
  const b64ToJson = b64 => {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  };
  /* برنامه‌ی اندروید جواب را اینجا برمی‌گرداند (JSON با فرمت base64) */
  global.__alaviResolve = function (id, b64) {
    const p = pending.get(id); if (!p) return;
    pending.delete(id);
    let r; try { r = b64ToJson(b64); } catch (e) { return p.reject(new PortalError("پاسخ نامعتبر از برنامه")); }
    p.resolve(r);
  };
  function bridge() {
    if (!global.AndroidBridge) throw new PortalError("این صفحه فقط داخل برنامه‌ی علوی‌یار کار می‌کند.");
    return global.AndroidBridge;
  }
  function nativeCall(fn) {
    return new Promise((resolve, reject) => {
      const id = ++seq;
      pending.set(id, { resolve, reject });
      try { fn(bridge(), id); } catch (e) { pending.delete(id); reject(e instanceof PortalError ? e : new PortalError("ارتباط با برنامه برقرار نشد")); }
    });
  }
  const enc = encodeURIComponent;
  const form = obj => Object.keys(obj).map(k => enc(k) + "=" + enc(obj[k])).join("&");

  /* ---------- وضعیت نشست ---------- */
  let token = null, personId = null;
  let gate = Promise.resolve();            // بین درخواست‌ها کمی فاصله می‌افتد (فشار کم به سرور مدرسه)
  const GAP_MS = 250;

  const commonHeaders = () => ({ "X-Requested-With": "XMLHttpRequest", "Referer": BASE + "/", "Origin": BASE });

  async function http(method, url, headers, body, follow) {
    const r = await nativeCall((b, id) => b.http(id, method, url, JSON.stringify(headers), body || "", follow !== false));
    if (r.error) throw new PortalError("ارتباط با پرتال برقرار نشد");
    return r;
  }

  function queued(fn) {
    const run = gate.then(fn);
    gate = run.catch(() => {}).then(() => new Promise(r => setTimeout(r, GAP_MS)));
    return run;
  }

  async function get(url) {
    if (!token || !personId) throw new SessionExpired("لاگین نشده");
    if (!url.startsWith(BASE + "/")) throw new PortalError("آدرس نامعتبر");
    const r = await queued(() => http("GET", url, Object.assign(commonHeaders(), { "token": token, "Accept": "text/plain, */*; q=0.01" })));
    if (r.status === 401 || r.status === 403) throw new SessionExpired("نشست منقضی شده");
    if (r.status !== 200) throw new PortalError("پرتال خطا داد (کد " + r.status + ")");
    return r.body;
  }

  /* ---------- ابزار پارسر (هم‌معنی با BeautifulSoup در portal.py) ---------- */
  const parse = html => new DOMParser().parseFromString(html, "text/html");
  function txt(el) {
    if (!el) return "";
    const w = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const parts = []; let n;
    while ((n = w.nextNode())) {
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      const t = n.nodeValue.trim(); if (t) parts.push(t);
    }
    return parts.join(" ").replace(/\s+/g, " ").trim();
  }
  function rawText(el) {
    if (!el) return "";
    const w = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let s = "", n;
    while ((n = w.nextNode())) {
      const tag = n.parentNode && n.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE") continue;
      s += n.nodeValue;
    }
    return s;
  }
  const nextSpan = el => { let s = el.nextElementSibling; while (s && s.tagName !== "SPAN") s = s.nextElementSibling; return s; };
  const trimColon = s => s.replace(/[:：\s]+$/, "");
  function pairs(container) {
    const out = {};
    container.querySelectorAll("span.pen_muted, span.pen_base").forEach(lab => {
      const key = trimColon(txt(lab)).trim(), val = nextSpan(lab);
      if (key && val && !(key in out)) out[key] = txt(val);
    });
    return out;
  }
  const ZW = "‌";
  function info(root, caption) {
    const want = caption.split(ZW).join("");
    for (const g of root.querySelectorAll("div.info_group")) {
      const cap = g.querySelector("span.caption");
      if (cap && trimColon(txt(cap).split(ZW).join("")) === want) { const v = nextSpan(cap); return txt(v); }
    }
    return "";
  }
  const clean = s => s.replace(/\r/g, "").trim().split("\n").map(l => l.replace(/\s+$/, "")).join("\n").replace(/\n{3,}/g, "\n\n");
  function fixTeacher(name) {
    const i = name.indexOf("،");
    if (i < 0) return name;
    return (name.slice(i + 1).trim() + " " + name.slice(0, i).trim()).trim();
  }
  const attr = (el, a) => el.getAttribute(a) || "";

  /* ---------- کارنامه ---------- */
  function parseReportList(html) {
    const doc = parse(html), items = [];
    doc.querySelectorAll("div.section").forEach(sec => {
      const year = txt(sec.querySelector(".heading_2 span")) || "—";
      sec.querySelectorAll("div.box_item").forEach(box => {
        let main = null, analysis = null;
        box.querySelectorAll("span.item[data-url]").forEach(sp => {
          const url = attr(sp, "data-url");
          if (url.includes("/rc-ea/")) analysis = url; else if (url.includes("/rc/")) main = sp;
        });
        if (main) items.push({ year, title: txt(main), url: attr(main, "data-url"), analysisUrl: analysis });
      });
    });
    return items;
  }
  function parseReportCard(html) {
    const doc = parse(html), h1 = doc.querySelector("h1.heading_1");
    if (!h1) return null;
    const card = { title: txt(h1), totals: [], lessons: [] };
    doc.querySelectorAll("div.box_item.info").forEach(box => {
      const head = box.querySelector(".heading_2 span"); if (!head) return;
      const p = pairs(box);
      if ("نمره" in p || "تراز" in p) card.totals.push({ name: txt(head), score: p["نمره"] || "", std: p["تراز"] || "", rank: p["رتبه"] || "" });
    });
    doc.querySelectorAll("#lesson_accordion .card").forEach(c => {
      const head = c.querySelector(".card-header"); if (!head) return;
      const nameEl = head.querySelector("span");
      const les = { name: txt(nameEl), score: "", stdScore: "", rank: "", correct: "", wrong: "", blank: "", groupAvg: "" };
      head.querySelectorAll("span.text-nowrap").forEach(wrap => {
        const lab = wrap.querySelector("span.pen_base"), val = wrap.querySelector("span.badge");
        if (!lab || !val) return;
        const k = trimColon(txt(lab));
        if (k === "نمره") les.score = txt(val); else if (k === "تراز") les.stdScore = txt(val); else if (k === "رتبه") les.rank = txt(val);
      });
      const body = c.querySelector(".card-body");
      if (body) { const d = pairs(body); les.correct = d["پاسخ درست"] || ""; les.wrong = d["پاسخ نادرست"] || ""; les.blank = d["سفید"] || ""; }
      card.lessons.push(les);
    });
    const grp = doc.querySelector("#avg_collapse_1");
    if (grp) {
      const byName = {};
      grp.querySelectorAll("div.box_item.info").forEach(box => {
        const nm = box.querySelector("span.text-dark"), sc = box.querySelector("span.text-info");
        if (nm && sc) byName[txt(nm)] = txt(sc);
      });
      card.lessons.forEach(l => { l.groupAvg = byName[l.name] || ""; });
    }
    return card;
  }

  /* ---------- تکالیف ---------- */
  function parseHwClasses(html) {
    const doc = parse(html), out = [];
    doc.querySelectorAll("div.section").forEach(sec => {
      const year = txt(sec.querySelector(".heading_2 span"));
      sec.querySelectorAll("div.item[data-url]").forEach(it => out.push({ year, title: txt(it), url: attr(it, "data-url") }));
    });
    return out;
  }
  function parseHwMonths(html) {
    const doc = parse(html), months = [];
    doc.querySelectorAll("#month > .card").forEach(card => {
      const month = { title: txt(card.querySelector(".card-header span")), days: [] };
      card.querySelectorAll(".card-body span.item[data-url]").forEach(it => {
        const inner = it.querySelector("span");
        month.days.push({ title: inner ? txt(inner) : txt(it), url: attr(it, "data-url") });
      });
      if (month.days.length) months.push(month);
    });
    return months;
  }
  function parseHwDay(html) {
    const doc = parse(html);
    if (!doc.querySelector("h1.heading_1")) return null;
    const page = { date: info(doc, "تاریخ"), lessons: [] };
    doc.querySelectorAll("#lesson > .card").forEach(card => {
      const lesson = { name: txt(card.querySelector(".card-header span")), teacher: fixTeacher(info(card, "مدرس")), items: [] };
      card.querySelectorAll("fieldset").forEach(fs => {
        const legend = fs.querySelector("legend span"), body = fs.querySelector(".fieldset_body");
        if (!body) return;
        const label = txt(legend) || "توضیح";
        const files = [...body.querySelectorAll("a[href]")].map(a => attr(a, "href")).filter(h => h.includes("/file/dl/"));
        const text = files.length ? "" : clean(rawText(body));
        if (files.length || text) lesson.items.push({ label, text, files });
      });
      if (lesson.items.length) page.lessons.push(lesson);
    });
    return page;
  }

  /* ---------- تردد ---------- */
  function parseTraffic(html) {
    const doc = parse(html), weeks = [];
    doc.querySelectorAll("#traffic > .card").forEach(card => {
      const week = { title: txt(card.querySelector(".card-header span")), days: [] };
      let school = "";
      card.querySelectorAll(".card-body .heading_2 span, .card-body .box_item.info").forEach(el => {
        if (!el.classList.contains("box_item")) { school = txt(el); return; }
        const m = txt(el.querySelector("h3 span")).match(/^(\d{4}\/\d{2}\/\d{2})\s*(.*)$/);
        if (!m) return;
        const day = { date: m[1], weekday: m[2].trim(), school, entry: "", exit: "" };
        el.querySelectorAll("div.info_group").forEach(g => {
          const lab = g.querySelector("span.pen_muted"), badge = g.querySelector("span.badge");
          const key = trimColon(txt(lab)), val = badge ? txt(badge) : "";
          if (key === "ورود") day.entry = val; else if (key === "خروج") day.exit = val;
        });
        week.days.push(day);
      });
      if (week.days.length) weeks.push(week);
    });
    return weeks;
  }

  /* ---------- نمونه سوال ---------- */
  const EXAM_LEVELS = [["دبستان", "دبستان"], ["متوسطه اول", "متوسطه-اول"], ["متوسطه دوم", "متوسطه-دوم"]];
  function parseExamGrades(html) {
    const doc = parse(html), out = [];
    doc.querySelectorAll("div.section").forEach(sec => {
      const grade = { title: txt(sec.querySelector(".heading_2 span")), courses: [] };
      sec.querySelectorAll("span.item[data-url]").forEach(it => grade.courses.push({ title: txt(it), url: attr(it, "data-url") }));
      if (grade.courses.length) out.push(grade);
    });
    return out;
  }
  function parseExamList(html) {
    const doc = parse(html), h1 = doc.querySelector("h1.heading_1");
    if (!h1) return null;
    const lst = { title: txt(h1), pages: 1, exams: [] };
    const nums = [...doc.querySelectorAll(".pagination .page-link")].map(a => txt(a)).filter(t => /^\d+$/.test(t)).map(Number);
    lst.pages = nums.length ? Math.max.apply(null, nums) : 1;
    doc.querySelectorAll("div.section div.item[data-url]").forEach(it => {
      const title = it.querySelector("div.mb-3");
      lst.exams.push({ title: txt(title) || txt(it), url: attr(it, "data-url"), code: info(it, "کد"), kind: info(it, "نوع"), count: info(it, "تعداد پرسش") });
    });
    return lst;
  }
  function parseExamPage(html) {
    const doc = parse(html), h1 = doc.querySelector("h1.heading_1");
    if (!h1) return null;
    const page = { title: txt(h1), kind: info(doc, "نوع"), total: info(doc, "نمره‌ی کل"), files: [] };
    doc.querySelectorAll("div.section .box_item").forEach(box => {
      const a = box.querySelector("a[href]");
      if (a && attr(a, "href").includes("/dl/")) page.files.push({ label: txt(box.querySelector("div.mb-2")) || "فایل", url: attr(a, "href") });
    });
    return page;
  }

  /* ---------- API عمومی ---------- */
  const Portal = {
    BASE, EXAM_LEVELS, PortalError, LoginFailed, SessionExpired, UserNotFound,
    get loggedIn() { return !!(token && personId); },
    forget() { token = null; personId = null; },

    async login(nid, pw) {
      const r = await http("POST", BASE + "/person/signIn", Object.assign(commonHeaders(), {
        "Accept": "application/json, text/javascript, */*; q=0.01", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      }), form({ "person[personCategory_id_meta]": "personCategory_student", "person[nationalIdNo]": nid, "person[password]": pw }));
      let data; try { data = JSON.parse(r.body); } catch (e) { throw new LoginFailed("کد ملی یا گذرواژه اشتباه است."); }
      if (!data || typeof data !== "object" || !data.token || !data.id) throw new LoginFailed("کد ملی یا گذرواژه اشتباه است.");
      token = data.token; personId = data.id;
      const photo = data.photo ? "data:" + (data.photo_mimeType || "image/jpeg") + ";base64," + data.photo : "";
      return { name: String(data.title || "").trim(), photo };
    },
    async requestPassword(nid, mobile) {
      const r = await http("POST", BASE + "/person/getPassword", Object.assign(commonHeaders(), {
        "Accept": "*/*", "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      }), form({ personCategory_id_meta: "personCategory_student", nationalIdNo: nid, mobile }), false);
      if (r.status === 404) throw new UserNotFound("اطلاعات در پرتال یافت نشد.");
      if (r.status < 200 || r.status >= 300) throw new PortalError("پرتال پاسخ غیرعادی داد (کد " + r.status + ").");
      return true;
    },
    async reportList() {
      const html = await get(`${BASE}/rc-lst/${personId}?seq=1`);
      const items = parseReportList(html);
      if (!items.length && !html.includes("heading_1")) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return items;
    },
    async reportCard(url) {
      const card = parseReportCard(await get(url));
      if (!card) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return card;
    },
    async hwClasses() {
      const html = await get(`${BASE}/homework/student/selectCategory/${personId}?seq=1`);
      if (!html.includes("heading_1")) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return parseHwClasses(html);
    },
    async hwMonths(classUrl) {
      const html = await get(classUrl + "?seq=1");
      if (!html.includes("heading_1")) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return parseHwMonths(html);
    },
    async hwDay(dayUrl) {
      const page = parseHwDay(await get(dayUrl + "?seq=1"));
      if (!page) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return page;
    },
    async trafficWeeks() {
      const html = await get(`${BASE}/traffic/select/${personId}?seq=2`);
      if (!html.includes("heading_1")) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return parseTraffic(html);
    },
    async examGrades(levelSlug) {
      const html = await get(`${BASE}/exam/selectCourse/${enc(levelSlug)}?seq=1`);
      if (!html.includes("heading_1")) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return parseExamGrades(html);
    },
    async examList(courseUrl, page) {
      const url = !page || page <= 1 ? courseUrl + (courseUrl.includes("?") ? "&" : "?") + "seq=1" : `${courseUrl.split("?")[0]}/${page}?seq=1`;
      const lst = parseExamList(await get(url));
      if (!lst) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return lst;
    },
    async examPage(examUrl) {
      const page = parseExamPage(await get(examUrl + (examUrl.includes("?") ? "&" : "?") + "seq=1"));
      if (!page) throw new SessionExpired("پاسخ نامعتبر از پرتال");
      return page;
    },
    /* دانلود مستقیم از سرور پرتال داخل گوشی (پوشه‌ی دانلودها) */
    async download(url) {
      if (!token || !personId) throw new SessionExpired("لاگین نشده");
      if (!(url.startsWith(BASE + "/") && url.includes("/dl/"))) throw new PortalError("آدرس فایل نامعتبر");
      const r = await queued(() => nativeCall((b, id) => b.download(id, url, JSON.stringify({ "token": token, "Accept": "*/*", "Referer": BASE + "/" }))));
      if (r.error === "session") throw new SessionExpired("نشست منقضی شده");
      if (r.error) throw new PortalError(r.message || "دریافت فایل ممکن نشد");
      return r; // {name, uri, mime}
    },
  };
  Portal._parsers = { parseReportList, parseReportCard, parseHwClasses, parseHwMonths, parseHwDay, parseTraffic, parseExamGrades, parseExamList, parseExamPage, fixTeacher };
  global.Portal = Portal;
})(window);
