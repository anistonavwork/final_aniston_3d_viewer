/* LEFT SIDEBAR CONTROLLER — Accordion with all sections collapsed initially.
   Supports BOTH JSON formats:
   1) { "categories": { "education": [...], "medical": [...], ... } }
   2) { "models": [ { name, path, category? }, ... ] }
*/

const LS_KEYS = { WIDTH: "left.width", COLLAPSED: "left.collapsed" };

export async function initSidebar() {
  const appRoot   = document.getElementById("app-root");
  const left      = document.getElementById("left-slot");
  const accordion = document.getElementById("category-accordion");
  const collapseBtn = document.getElementById("left-collapse-btn");
  const sash        = document.getElementById("left-sash");

  // ---- Restore width (fixed width prevents affecting viewer centering) ----
  const savedW = parseInt(localStorage.getItem(LS_KEYS.WIDTH) || "0", 10);
  if (savedW) {
    document.documentElement.style.setProperty("--sidebar-w", `${savedW}px`);
    if (left) left.style.width = `${savedW}px`;
  }

  // ---- Collapsed? ----
  if (localStorage.getItem(LS_KEYS.COLLAPSED) === "1") {
    removeLeftFromDOM();
    return;
  }

  // ---- Load models.json ----
  try {
    const res = await fetch("data/models.json");
    const json = await res.json();
    const jsonBase = new URL(".", res.url);

    // Convert to { CategoryName => [ {name, path, description}, ... ] }
    const grouped = normalizeToCategories(json);

    // Render with all sections collapsed initially (accordion behaviour)
    renderAccordion(accordion, grouped, jsonBase);
  } catch (err) {
    console.error("[sidebar] Failed to load data/models.json:", err);
    if (accordion) {
      accordion.innerHTML = `<div class="small">Could not load <code>data/models.json</code>. Check file path & JSON format.</div>`;
    }
  }

  // ---- Collapse button & resizer ----
  collapseBtn?.addEventListener("click", () => removeLeftFromDOM(true));
  enableResize(left, sash);

  // ==================== Helpers ====================

  // Accept new schema {"categories":{...}} OR legacy {"models":[...]}
  function normalizeToCategories(data) {
    const result = new Map();

    if (data && data.categories && typeof data.categories === "object") {
      // New structure with buckets
      for (const [key, arr] of Object.entries(data.categories)) {
        const niceName = toTitle(key);
        const list = Array.isArray(arr) ? arr.slice() : [];
        result.set(niceName, list);
      }
      return result;
    }

    if (Array.isArray(data?.models)) {
      // Legacy flat list -> bucket by "category" or "Uncategorized"
      data.models.forEach(m => {
        const cat = toTitle(m.category || "Uncategorized");
        if (!result.has(cat)) result.set(cat, []);
        result.get(cat).push(m);
      });
      return result;
    }

    // Fallback
    return new Map([["Uncategorized", []]]);
  }

  function renderAccordion(container, grouped, jsonBase) {
    if (!container) return;
    container.innerHTML = "";

    // Alphabetical category order; change here if you want custom sequence
    const cats = Array.from(grouped.keys()).sort((a,b)=> a.localeCompare(b));

    // Create all <details> collapsed initially
    const detailsList = [];

    cats.forEach(catName => {
      const items = grouped.get(catName) || [];
      const details = document.createElement("details");
      details.open = false; // collapsed initially

      const summary = document.createElement("summary");
      summary.textContent = `${catName} (${items.length})`;
      details.appendChild(summary);

      const ul = document.createElement("ul");
      ul.className = "model-list";

      items.forEach(it => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = "model-link";
        btn.textContent = it.name || (it.path ? it.path.split("/").pop() : "Unnamed");

        // Resolve model href relative to the JSON location
        let href = it.path || "";
        try { href = new URL(it.path, jsonBase).href; } catch {}

        btn.addEventListener("click", () => {
          const ev = new CustomEvent("model:open", {
            bubbles: true,
            detail: { href, name: btn.textContent, category: catName, description: it.description || "" },
          });
          container.dispatchEvent(ev);
        });

        li.appendChild(btn);
        ul.appendChild(li);
      });

      details.appendChild(ul);
      container.appendChild(details);
      detailsList.push(details);
    });

    // Accordion behaviour: when one opens, close all the others
    detailsList.forEach((d, idx) => {
      d.addEventListener("toggle", () => {
        if (d.open) {
          // Close the rest silently; do NOT dispatch window resize
          detailsList.forEach((other, j) => { if (j !== idx && other.open) other.open = false; });
        }
      });
    });

    // Make sure container scrolls within fixed width (CSS already handles this)
    // Here we just ensure a sensible style in case CSS is missing:
    container.style.overflowY = container.style.overflowY || "auto";
  }

  function toTitle(s) {
    if (!s) return "Uncategorized";
    return String(s).replace(/[_-]+/g, " ").replace(/\s+/g," ").trim()
      .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1));
  }

  function removeLeftFromDOM(persist = false) {
    const el = document.getElementById("left-slot");
    if (!el) return;
    el.parentNode.removeChild(el);
    appRoot?.classList.add("no-left");
    if (persist) localStorage.setItem(LS_KEYS.COLLAPSED, "1");
  }

  function enableResize(sidebarEl, sashEl) {
    if (!sidebarEl || !sashEl) return;
    let dragging = false, startX = 0, startW = 0;

    const onDown = (e) => {
      dragging = true;
      startX = e.clientX;
      startW = sidebarEl.getBoundingClientRect().width;
      document.body.classList.add("resizing");
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    };

    const onMove = (e) => {
      if (!dragging) return;
      const delta = e.clientX - startX;
      let w = startW + delta;
      w = Math.max(220, Math.min(520, w));
      sidebarEl.style.width = `${w}px`;
      document.documentElement.style.setProperty("--sidebar-w", `${w}px`);
      // Only width changes cause viewer resize; opening/closing details won't.
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("resizing");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const w = sidebarEl.getBoundingClientRect().width;
      localStorage.setItem(LS_KEYS.WIDTH, String(Math.round(w)));
      localStorage.setItem(LS_KEYS.COLLAPSED, "0");
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };

    sashEl.addEventListener("mousedown", onDown);
  }
}
