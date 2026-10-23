"use strict";
/* ابزارهای کوچک مشترک: اعداد فارسی، تبدیل نمره، escape */
const DIG = "۰۱۲۳۴۵۶۷۸۹";
const toFa = s => String(s).replace(/\d/g, d => DIG[d]).replace(/\./g, "٫");
const toEn = s => String(s).replace(/[۰-۹]/g, d => DIG.indexOf(d)).replace(/[٠-٩]/g, d => d.charCodeAt(0) - 1632);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, root = document) => root.querySelector(sel);
const delay = ms => new Promise(r => setTimeout(r, ms));
const num = s => {
  if (s == null) return null;
  const t = toEn(s).replace(/[٫،,\/]/g, ".").replace("−", "-");
  const m = t.match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
};
const fmt = x => { if (x == null) return "—"; const r = Math.round(x * 10) / 10; return Number.isInteger(r) ? String(r) : String(r); };
const F = x => (x == null ? "—" : toFa(fmt(x)));
const N = x => toFa(x);
