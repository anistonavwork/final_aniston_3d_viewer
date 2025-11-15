/* RIGHT VERTICAL SIDEBAR CONTROLLER — inline panels, all actions are toggles */

const LS = { COLLAPSED: "right.collapsed", WIDTH: "right.width" };

// Fallback HTML if a stale fragment is cached
const TEMPLATE = `
  <div id="right-sash" aria-hidden="true"></div>
  <div class="rightbar">
    <div class="right-head">
      <strong>Tools</strong>
      <button id="right-collapse-btn" class="btn-icon" title="Hide tools" aria-label="Hide tools">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
      </button>
    </div>

    <nav class="tool-list" id="tool-list">
      <button class="tool-item" data-panel="open"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 2.5L18.5 9H14z"/></svg>
      </span><span class="tool-label">Open File</span></button>

      <button class="tool-item" data-panel="bg"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18c.9 0 1.5-.6 1.5-1.5 0-.9-.6-1.5-1.5-1.5H9a3 3 0 0 1 0-6h.5a2.5 2.5 0 1 0 0-5H10a9 9 0 0 0-8 9h2a7 7 0 1 1 7 7c-4.97 0-9-4.03-9-9S7.03 3 12 3z"/></svg>
      </span><span class="tool-label">Background</span></button>

      <button class="tool-item" data-panel="exp"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10-9h2V1h-2v3zm7.03 1.05l-1.79 1.79 1.8 1.79 1.79-1.79-1.8-1.79zM17 13h3v-2h-3v2zM6.76 19.16l-1.8 1.79 1.79 1.79 1.8-1.79-1.79-1.79zM11 23h2v-3h-2v3zm7.03-2.21l1.79-1.79-1.79-1.79-1.79 1.79zM12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
      </span><span class="tool-label">Exposure</span></button>

      <button class="tool-item" data-panel="wire"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm2 2v6h6V5H5zm8 0v6h6V5h-6zM5 13v6h6v-6H5zm8 0v6h6v-6h-6z"/></svg>
      </span><span class="tool-label">Wireframe</span></button>

      <button class="tool-item" data-panel="grid"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3zM9 5v14M15 5v14M5 9h14M5 15h14"/></svg>
      </span><span class="tool-label">Grid</span></button>

      <button class="tool-item" data-panel="axes"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h2v-6h6v-2H5V7H3v14zm12-8l-4 8h2l.8-1.8h2.4L17 21h2l-4-8zm-.6 4l.6-1.3.6 1.3h-1.2z"/></svg>
      </span><span class="tool-label">Axes</span></button>

      <button class="tool-item" data-panel="autorotate"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5 0 .9-.24 1.73-.66 2.45l1.46 1.46A6.97 6.97 0 0 0 19 13c0-3.87-3.13-7-7-7zm-5 2.55A6.97 6.97 0 0 0 5 13c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5 0-.9.24-1.73.66-2.45L6.2 8.55z"/></svg>
      </span><span class="tool-label">Auto-Rotate</span></button>

      <button class="tool-item" data-panel="quickanim"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h16v2H4V4zm0 7h16v2H4v-2h0zm0 7h16v-2H4v2z"/></svg>
      </span><span class="tool-label">Quick Animations</span></button>

      <button class="tool-item" data-panel="pbr"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2l9 4.9v9.8L12 22 3 16.7V6.9L12 2z"/></svg>
      </span><span class="tool-label">Materials</span></button>

      <button class="tool-item" data-panel="lights"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3a7 7 0 017 7c0 3.04-1.9 5.63-4.57 6.56L14 20h-4l-.43-3.44A7 7 0 015 10a7 7 0 017-7z"/></svg>
      </span><span class="tool-label">Lights</span></button>

      <button class="tool-item" data-panel="matreset"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4a8 8 0 108 8h-2A6 6 0 1112 6V4z"/></svg>
      </span><span class="tool-label">Material Reset</span></button>

      <button class="tool-item" data-panel="fit"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 2v2a8 8 0 018 8h2A10 10 0 0011 2zM2 11h2a8 8 0 0 0 8 8v2A10 10 0 0 1 2 11z"/></svg>
      </span><span class="tool-label">Fit to View</span></button>

      <button class="tool-item" data-panel="reset"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35A7.95 7.95 0 0012 4a8 8 0 100 16 8 8 0 007.75-6h-2.08A6 6 0 0112 6v-4z"/></svg>
      </span><span class="tool-label">Reset</span></button>

      <button class="tool-item" data-panel="screenshot"><span class="tool-ico">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 5h-3.2l-1.6-2H8.8L7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/></svg>
      </span><span class="tool-label">Screenshot</span></button>
    </nav>

    <input id="rp-file" type="file" accept=".glb,.gltf,.gbl" class="visually-hidden" />
  </div>
</aside>
`;

export function initRightPanel() {
  const appRoot = document.getElementById("app-root");
  const right = document.getElementById("right-slot");
  if (!right) return;

  let list = right.querySelector("#tool-list");
  let collapseBtn = right.querySelector("#right-collapse-btn");
  let fileInput = right.querySelector("#rp-file");
  let sash = right.querySelector("#right-sash");

  const count = list ? list.querySelectorAll(".tool-item").length : 0;
  if (!list || !collapseBtn || count <= 3) {
    right.innerHTML = TEMPLATE;
    list = right.querySelector("#tool-list");
    collapseBtn = right.querySelector("#right-collapse-btn");
    fileInput = right.querySelector("#rp-file");
    sash = right.querySelector("#right-sash");
  }

  // restore width
  const savedW = parseInt(localStorage.getItem(LS.WIDTH) || "0", 10);
  if (savedW) {
    right.style.width = `${savedW}px`;
    document.documentElement.style.setProperty("--rightbar-w", `${savedW}px`);
  }
  if (localStorage.getItem(LS.COLLAPSED) === "1") {
    removeRightFromDOM(true);
    return;
  }

  // register panels
  const R = {
    open: panel_Open,
    bg: panel_Background,
    exp: panel_Exposure,
    wire: panel_Wireframe,
    grid: panel_Grid,
    axes: panel_Axes,
    autorotate: panel_AutoRotate,
    quickanim: panel_QuickAnim,
    pbr: panel_PBR,
    lights: panel_Lights,
    matreset: panel_MaterialReset,
    fit: panel_Fit,
    reset: panel_Reset,
    screenshot: panel_Screenshot,
  };

  // inline panel toggling
  list.querySelectorAll(".tool-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.panel;
      const next = btn.nextElementSibling;
      if (next && next.classList.contains("tool-panel")) {
        if (next.dataset.key === key) { next.remove(); return; }
        next.remove();
      }
      const p = buildPanel(key);
      if (p) btn.insertAdjacentElement("afterend", p);
      p?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  collapseBtn.addEventListener("click", () => removeRightFromDOM(true));
  fileInput?.addEventListener("change", (e)=>{
    const f = e.target.files?.[0];
    if (f && window.viewer3D?.loadModel) window.viewer3D.loadModel(URL.createObjectURL(f));
  });

  enableResize(right, sash);

  // helpers
  function viewer(){ return window.viewer3D || {}; }
  function buildPanel(key){ const mk = R[key]; if(!mk) return null; const el = mk(); el.dataset.key = key; return el; }

  function panelShell(title) {
    const el = document.createElement("div");
    el.className = "tool-panel";
    el.innerHTML = `
      <div class="panel-head">
        <strong>${title}</strong>
        <button class="btn-icon panel-close" title="Close">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M18.3 5.71L12 12l6.3 6.29-1.41 1.41L10.59 13.41 4.29 19.71 2.88 18.3 9.17 12 2.88 5.71 4.29 4.3 10.59 10.59 16.89 4.3z"/></svg>
      </div>
      <div class="panel-body"></div>
    `;
    el.querySelector(".panel-close").onclick = () => el.remove();
    return el;
  }
  const row = () => { const d=document.createElement("div"); d.className="row"; return d; };
  const label = t => { const l=document.createElement("label"); l.textContent=t; return l; };
  const btn = (t,fn)=>{ const b=document.createElement("button"); b.className="btn"; b.textContent=t; b.onclick=fn; return b; };
  const slider=(txt,min,max,step,val,on)=>{ const r=row(),lab=label(txt),i=document.createElement("input"); i.type="range"; i.min=min;i.max=max;i.step=step;i.value=val;i.oninput=()=>on(parseFloat(i.value)); r.append(lab,i); return r; };
  const check =(txt,on)=>{ const r=row(),cb=document.createElement("input"); cb.type="checkbox"; const lab=label(txt); r.append(lab,cb); cb.onchange=()=>on(!!cb.checked); return r; };
  const color =(txt,val,on)=>{ const r=row(),lab=label(txt),i=document.createElement("input"); i.type="color"; i.value=val; i.oninput=()=>on(i.value); r.append(lab,i); return r; };

  // panels
  function panel_Open(){ const el=panelShell("Open File"); const b=el.querySelector(".panel-body"); b.append(btn("Choose .glb/.gltf", ()=>document.getElementById("rp-file")?.click())); return el; }
  function panel_Background(){ const el=panelShell("Background"); const b=el.querySelector(".panel-body"); b.append(color("Color","#000000", hex=>{ viewer().scene && (viewer().scene.background = new (viewer().THREE||window.THREE).Color(hex)); })); return el; }
  function panel_Exposure(){ const el=panelShell("Exposure"); const b=el.querySelector(".panel-body"); const cur=viewer().renderer?.toneMappingExposure ?? 1.0; b.append(slider("Exposure",0.3,2.0,0.01,cur,v=>{ if(viewer().renderer) viewer().renderer.toneMappingExposure=v; })); return el; }
  function panel_Wireframe(){ const el=panelShell("Wireframe"); const b=el.querySelector(".panel-body"); b.append(check("Enable", on=>{ viewer().scene?.traverse(o=>{ if(o.isMesh){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>m&&(m.wireframe=on));}});})); return el; }
  function panel_Grid(){ const el=panelShell("Grid"); const b=el.querySelector(".panel-body"); b.append(check("Show grid", on=>{ const sc=viewer().scene; if(!sc)return; if(on){ if(!sc.userData.grid) sc.userData.grid=new (viewer().THREE||window.THREE).GridHelper(10,10,0x444,0x222); sc.add(sc.userData.grid);} else if(sc.userData.grid){ sc.remove(sc.userData.grid);} })); return el; }
  function panel_Axes(){ const el=panelShell("Axes"); const b=el.querySelector(".panel-body"); b.append(check("Show axes", on=>{ const sc=viewer().scene; if(!sc)return; if(on){ if(!sc.userData.axes) sc.userData.axes=new (viewer().THREE||window.THREE).AxesHelper(1.5); sc.add(sc.userData.axes);} else if(sc.userData.axes){ sc.remove(sc.userData.axes);} })); return el; }

  function panel_AutoRotate(){
    const el=panelShell("Auto-Rotate");
    const b = el.querySelector(".panel-body");
    const on = !!viewer().isAutoRotating?.();
    const c = check("Enable", v => viewer().setAutoRotate?.(v)).querySelector("input");
    c.checked = on;
    b.append(c.parentElement);
    b.append(slider("Speed",-5,5,0.1, viewer().controls?.autoRotateSpeed ?? 1, v => { if(viewer().controls) viewer().controls.autoRotateSpeed = v; }));
    return el;
  }

  function panel_QuickAnim(){
    const el = panelShell("Quick Animations");
    const b  = el.querySelector(".panel-body");
    const make = (text, mode) => btn(text, ()=>{
      const current = viewer().getQuickAnimMode?.();
      const next = viewer().setQuickAnim?.({ mode }); // toggles if same
      // nothing else needed; viewer ensures mutual exclusion & centering
    });

    const g = document.createElement("div");
    g.style.display='grid'; g.style.gap='6px';
    g.append(
      make("None","none"),
      make("Turntable","turntable"),
      make("Swing","swing"),
      make("Jump & Turn","jump"),
      make("Hover","hover"),
    );
    b.append(g);

    b.append(slider("Speed",0.2,3.0,0.01,1.0,v=>viewer().setQuickAnim?.({speed:v})));
    b.append(slider("Amplitude",0.0,1.0,0.01,0.25,v=>viewer().setQuickAnim?.({amp:v})));
    b.append(slider("Height",0.0,0.6,0.01,0.15,v=>viewer().setQuickAnim?.({height:v})));

    const r = row();
    const toggleBtn = btn(viewer().areClipsPlaying?.() ? "Stop Built-in Animations" : "Play Built-in Animations",
      ()=>{
        const playing = viewer().toggleClips?.();
        toggleBtn.textContent = playing ? "Stop Built-in Animations" : "Play Built-in Animations";
      });
    r.append(toggleBtn);
    b.append(r);

    const tip = document.createElement("div");
    tip.className="small";
    tip.textContent="Each action is a toggle. Starting one animation stops others. Built-in clips auto-start on load.";
    b.append(tip);

    return el;
  }

  function panel_PBR(){
    const el=panelShell("Materials");
    const b=el.querySelector(".panel-body");
    b.append(slider("Roughness",0,1,0.01,0.5,v=>{ viewer().scene?.traverse(o=>{ if(o.isMesh){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>("roughness" in m)&&(m.roughness=v));}}); }));
    b.append(slider("Metalness",0,1,0.01,0.0,v=>{ viewer().scene?.traverse(o=>{ if(o.isMesh){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>("metalness" in m)&&(m.metalness=v));}}); }));
    return el;
  }

  function panel_Lights(){
    const el=panelShell("Lights");
    const b=el.querySelector(".panel-body");
    const L = viewer().lights || {};
    b.append(slider("Hemisphere",0,2,0.01, L.hemi?.intensity ?? 0.8, v=>{ if(L.hemi) L.hemi.intensity=v; }));
    b.append(slider("Key",0,2,0.01, L.key?.intensity ?? 1.1, v=>{ if(L.key) L.key.intensity=v; }));
    b.append(slider("Rim",0,2,0.01, L.rim?.intensity ?? 0.6, v=>{ if(L.rim) L.rim.intensity=v; }));
    return el;
  }

  function panel_MaterialReset(){
    const el=panelShell("Material Reset");
    const b=el.querySelector(".panel-body");
    b.append(btn("Reset all materials", ()=> viewer().resetMaterials?.()));
    return el;
  }

  function panel_Fit(){
    const el=panelShell("Fit to View");
    const b=el.querySelector(".panel-body");
    b.append(btn("Fit model", ()=> document.getElementById("viewer-canvas")
      ?.dispatchEvent(new Event("viewer:fit",{bubbles:true}))));
    return el;
  }

  function panel_Reset(){
    const el=panelShell("Reset View");
    const b=el.querySelector(".panel-body");
    b.append(btn("Reset view", ()=> document.getElementById("viewer-canvas")
      ?.dispatchEvent(new Event("viewer:reset",{bubbles:true}))));
    return el;
  }

  function panel_Screenshot(){
    const el=panelShell("Screenshot");
    const b=el.querySelector(".panel-body");
    b.append(btn("Download PNG", ()=>{
      const can=viewer().renderer?.domElement; if(!can) return;
      const url=can.toDataURL("image/png");
      const a=document.createElement("a"); a.href=url; a.download="screenshot.png"; document.body.appendChild(a); a.click(); a.remove();
    }));
    return el;
  }

  // housekeeping
  function removeRightFromDOM(persist=false){
    const el=document.getElementById("right-slot"); if(!el) return;
    el.parentNode.removeChild(el);
    appRoot.classList.add("no-right");
    if (persist) localStorage.setItem(LS.COLLAPSED,"1");
  }
  function enableResize(panelEl, sashEl){
    if(!sashEl) return;
    let dragging=false, sx=0, sw=0;
    const down=e=>{ dragging=true; sx=e.clientX; sw=panelEl.getBoundingClientRect().width;
      document.body.classList.add("resizing");
      window.addEventListener("mousemove",move);
      window.addEventListener("mouseup",up);
    };
    const move=e=>{
      if(!dragging) return;
      let w = sw - (e.clientX - sx);
      w = Math.max(180, Math.min(520, w));
      panelEl.style.width = `${w}px`;
      document.documentElement.style.setProperty("--rightbar-w", `${w}px`);
      requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));
    };
    const up=()=>{
      if(!dragging) return;
      dragging=false;
      document.body.classList.remove("resizing");
      window.removeEventListener("mousemove",move);
      window.removeEventListener("mouseup",up);
      const w = right.getBoundingClientRect().width;
      localStorage.setItem(LS.WIDTH, String(Math.round(w)));
      localStorage.setItem(LS.COLLAPSED,"0");
      requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));
    };
    sashEl.addEventListener("mousedown",down);
  }
}
