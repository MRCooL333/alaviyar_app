"use strict";
/* تحلیل نمرات: همان منطق analysis.py بات (سطح‌بندی روی ۲۰، لحن عامیانه) */
const TOL_FRAC = 0.03;
const normName = s => s.replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").replace(/\s+/g, " ").trim();
const cardScale = c => {
  const v = [...c.totals.map(t => num(t.score)), ...c.lessons.map(l => num(l.score))].filter(x => x != null);
  return v.length && Math.max(...v) <= 20.01 ? 20 : 100;
};
const rs1 = (v, f) => { const n = num(v); return n == null ? v : String(Math.round(n * f * 10) / 10); };
const rescaled = (c, f) => ({
  ...c,
  totals: c.totals.map(t => ({ ...t, score: rs1(t.score, f) })),
  lessons: c.lessons.map(l => ({ ...l, score: rs1(l.score, f), groupAvg: l.groupAvg ? rs1(l.groupAvg, f) : l.groupAvg })),
});
const status = (d, tol) => (d >= tol ? "up" : d <= -tol ? "down" : "flat");
const STATUS_TXT = { up: ["📈", "پیشرفت"], down: ["📉", "افت"], flat: ["➖", "تقریباً ثابت"] };
const pctChange = (a, b) => { if (b === 0) return ""; const p = Math.round((a - b) / Math.abs(b) * 100); return p ? ` (${p > 0 ? "+" : ""}${N(p)}٪)` : ""; };
const rankInfo = (ra, rb) => {
  const a = num(ra), b = num(rb);
  if (a == null || b == null) return null;
  const diff = Math.trunc(b - a);
  return { a, b, diff, txt: diff > 0 ? `${N(diff)} پله بهتر` : diff < 0 ? `${N(-diff)} پله پایین‌تر` : "بدون تغییر" };
};
const levelOf = s20 => (s20 >= 18 ? ["🌟", "عالی"] : s20 >= 15 ? ["👍", "خوب"] : s20 >= 12 ? ["🙂", "قابل قبول"] : ["💪", "نیازمند تلاش بیشتر"]);

function compare(a, b) {
  const sa = cardScale(a), sb = cardScale(b);
  let note = "";
  if (sa !== sb) { b = rescaled(b, sa / sb); note = `مقیاس نمره‌ی دو آزمون فرق داشت؛ نمره‌های آزمون مقایسه به مقیاس ${N(sa)} تبدیل شد.`; }
  const tol = TOL_FRAC * sa;
  const bTot = new Map(b.totals.map(t => [normName(t.name), t]));
  let oa = null, ob = null;
  const totals = [];
  for (const t of a.totals) {
    const o = bTot.get(normName(t.name)); const x = num(t.score);
    if (!o || x == null || num(o.score) == null) continue;
    const y = num(o.score);
    if (normName(t.name) === "کل") { oa = x; ob = y; }
    totals.push({ name: t.name, a: x, b: y, d: x - y, st: status(x - y, tol), rank: rankInfo(t.rank, o.rank) });
  }
  const bL = new Map(b.lessons.map(l => [normName(l.name), l]));
  const aNames = new Set(a.lessons.map(l => normName(l.name)));
  const rows = [], onlyA = [];
  for (const l of a.lessons) {
    const o = bL.get(normName(l.name)); const x = num(l.score);
    if (!o) { onlyA.push(l.name); continue; }
    const y = num(o.score); if (x == null || y == null) continue;
    const ga = num(l.groupAvg);
    rows.push({ l, o, a: x, b: y, d: x - y, st: status(x - y, tol), rank: rankInfo(l.rank, o.rank), ga,
      grp: ga == null ? null : x > ga + tol / 6 ? "above" : x < ga - tol / 6 ? "below" : "same" });
  }
  const onlyB = b.lessons.filter(l => !aNames.has(normName(l.name))).map(l => l.name);
  const up = rows.filter(r => r.d >= tol), down = rows.filter(r => r.d <= -tol), flat = rows.filter(r => r.d > -tol && r.d < tol);
  const best = rows.length ? rows.reduce((m, r) => (r.d > m.d ? r : m)) : null;
  const worst = rows.length ? rows.reduce((m, r) => (r.d < m.d ? r : m)) : null;
  return { aTitle: a.title, bTitle: b.title, note, scale: sa, tol, totals, rows, onlyA, onlyB, up, down, flat, best, worst,
    advice: advice(a, rows, oa, ob, up, down, sa, tol) };
}

function advice(a, rows, oa, ob, up, down, scale, tol) {
  let delta = 0;
  if (oa != null && ob != null) delta = oa - ob;
  else if (rows.length) delta = rows.reduce((s, r) => s + r.d, 0) / rows.length;
  let cur = oa;
  if (cur == null && rows.length) cur = rows.reduce((s, r) => s + r.a, 0) / rows.length;
  const out = [];
  if (delta >= tol) out.push(`🔥 دمت گرم! نسبت به آزمونی که باهاش مقایسه کردی حدود ${F(delta)} نمره بالاتر اومدی. زحمتت داره جواب می‌ده؛ همین مسیر رو ادامه بده 💪`);
  else if (delta <= -tol) out.push(`😅 این دفعه حدود ${F(-delta)} نمره از آزمون مقایسه پایین‌تر اومدی. ولی بیخیال، یه آزمون که همه‌چیز رو تعیین نمی‌کنه! بیا ببینیم کجا ضربه خوردی تا جبرانش کنی 💪`);
  else out.push("⚖️ نمره‌هات تقریباً ثابت موند؛ یعنی ریتمت خوبه. حالا وقتشه یه فشار کوچیک بیاری تا از این سطح بپری بالاتر 🚀");
  if (cur != null && cur >= -scale * 0.34 && cur <= scale) {
    const [emo, word] = levelOf(cur * 20 / scale);
    const comment = { "عالی": "تو اوجی! 🤩 فقط مراقب باش افت نکنی.", "خوب": "وضعیتت خوبه 😎 با یه کم تلاش بیشتر می‌تونی بری تو سطح «عالی».",
      "قابل قبول": "بد نیست 🙂 ولی ظرفیتت بیشتر از اینه؛ یه کم بیشتر تلاش کنی می‌پری بالاتر." }[word] || "فعلاً باید بیشتر تلاش کنی، ولی نگران نباش! از درس‌های ضعیف‌ترت شروع کن و قدم‌به‌قدم بیا بالا.";
    out.push(`${emo} سطح فعلی‌ات تو این آزمون: «${word}» (نمره‌ی ${F(cur)}). ${comment}`);
  }
  if (down.length) {
    const names = [...down].sort((x, y) => x.d - y.d).slice(0, 4).map(r => r.l.name).join("، ");
    out.push(`🔎 این درس‌ها بیشتر ضربه خوردن: ${names}.\nپیشنهاد: غلط‌های همین آزمون رو یکی‌یکی مرور کن و بنویس چرا غلط شد (بلد نبودم؟ هول شدم؟ وقت کم آوردم؟). اگه مفهومی گنگه، از معلمت بپرس، خجالت نداره 😉`);
  }
  if (rows.length) {
    const weak = rows.reduce((m, r) => (r.a < m.a ? r : m));
    if (cur != null && weak.a < cur - 0.05 * scale && !down.some(r => r.l.name === weak.l.name))
      out.push(`🎯 ضعیف‌ترین درست تو این آزمون «${weak.l.name}» بود (نمره‌ی ${F(weak.a)}). روزی ۲۰ دقیقه براش وقت بذار، تأثیرش رو زود می‌بینی.`);
  }
  const below = rows.filter(r => r.ga != null && r.a < r.ga - 0.005 * scale).map(r => r.l.name);
  if (below.length) out.push(`👥 تو این درس‌ها از میانگین گروه پایین‌تری: ${below.slice(0, 5).join("، ")}. یه کم روشون کار کنی از گروه جلو می‌زنی!`);
  const careless = rows.filter(r => (num(r.l.wrong) || 0) >= 2 && (num(r.l.wrong) || 0) > (num(r.l.blank) || 0) + 1).map(r => r.l.name);
  if (careless.length) out.push(`✍️ تو ${careless.slice(0, 3).join("، ")} غلط زیادی داشتی؛ هول نشو، سؤال‌ها رو با دقت بخون و حل‌شده‌ها رو مرور کن.`);
  if (up.length && delta < tol) out.push(`🌱 خبر خوب: تو ${[...up].sort((x, y) => y.d - x.d).slice(0, 3).map(r => r.l.name).join("، ")} پیشرفت داشتی! ادامه بده.`);
  out.push({ small: "📌 یادت باشه این تحلیل فقط از روی همین دو آزمونه. اگه چند آزمون پشت‌سرهم همین‌طور بود، با معلم یا مشاور مدرسه هم حرف بزن 🤝" });
  return out;
}
