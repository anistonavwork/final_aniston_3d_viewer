// Small helpers (DOM, fetch JSON with base URL resolve)
/* Misc helper functions: fetch JSON with base URL resolution, DOM helpers */

export async function fetchJSON(path) {
  const res = await fetch(path);
  const json = await res.json();
  const base = new URL(".", res.url);
  return { json, base };
}

export function $(sel, ctx = document) {
  return ctx.querySelector(sel);
}

export function $all(sel, ctx = document) {
  return Array.from(ctx.querySelectorAll(sel));
}

export function createEl(tag, attrs = {}, html = "") {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") el.className = v;
    else el.setAttribute(k, v);
  }
  if (html) el.innerHTML = html;
  return el;
}
