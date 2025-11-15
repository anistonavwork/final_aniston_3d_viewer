/* MAIN APPLICATION BOOTSTRAP */
const VERSION = String(Date.now());
function bust(path){ const sep = path.includes("?") ? "&" : "?"; return `${path}${sep}v=${VERSION}`; }

async function loadHTML(path){ const res = await fetch(bust(path)); const txt = await res.text(); const t=document.createElement("template"); t.innerHTML = txt.trim(); return t.content; }

async function mountComponents(){
  const root = document.getElementById("app-root"); root.innerHTML = "";
  const [leftHTML, viewerHTML, rightHTML] = await Promise.all([
    loadHTML("components/sidebar/sidebar.html"),
    loadHTML("components/viewer/viewer.html"),
    loadHTML("components/rightpanel/rightpanel.html"),
  ]);
  root.appendChild(leftHTML); root.appendChild(viewerHTML); root.appendChild(rightHTML);

  const { initViewer }    = await import(bust("./../components/viewer/viewer.js"));
  const { initSidebar }   = await import(bust("./../components/sidebar/sidebar.js"));
  const { initRightPanel }= await import(bust("./../components/rightpanel/rightpanel.js"));

  await initViewer(); await initSidebar(); await initRightPanel();
  requestAnimationFrame(()=> window.dispatchEvent(new Event("resize")));
}

function setupGlobalShortcuts(){
  window.addEventListener("keydown", async (e)=>{
    if (e.altKey && e.code==="KeyL"){ e.preventDefault();
      const root = document.getElementById("app-root");
      if (document.getElementById("left-slot")){ document.getElementById("left-slot").remove(); root.classList.add("no-left"); localStorage.setItem("left.collapsed","1"); }
      else { await restoreLeftSidebar(); }
      requestAnimationFrame(()=> window.dispatchEvent(new Event("resize")));
    }
    if (e.altKey && e.code==="KeyR"){ e.preventDefault();
      const root = document.getElementById("app-root");
      if (document.getElementById("right-slot")){ document.getElementById("right-slot").remove(); root.classList.add("no-right"); localStorage.setItem("right.collapsed","1"); }
      else { await restoreRightPanel(); }
      requestAnimationFrame(()=> window.dispatchEvent(new Event("resize")));
    }
  });
}

async function restoreLeftSidebar(){
  const root = document.getElementById("app-root");
  if (document.getElementById("left-slot")) return;
  const frag = await loadHTML("components/sidebar/sidebar.html");
  const viewer = document.getElementById("viewer-slot");
  root.insertBefore(frag, viewer); root.classList.remove("no-left"); localStorage.setItem("left.collapsed","0");
  const { initSidebar } = await import(bust("./../components/sidebar/sidebar.js")); await initSidebar();
}

async function restoreRightPanel(){
  const root = document.getElementById("app-root");
  if (document.getElementById("right-slot")) return;
  const frag = await loadHTML("components/rightpanel/rightpanel.html");
  root.appendChild(frag); root.classList.remove("no-right"); localStorage.setItem("right.collapsed","0");
  const { initRightPanel } = await import(bust("./../components/rightpanel/rightpanel.js")); await initRightPanel();
}

function ensureLeftEdgeButton(){
  let btn = document.querySelector(".edge-toggle-left");
  if (!btn){ btn = document.createElement("button"); btn.className="edge-toggle-left"; btn.innerHTML=`<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg> Show Sidebar`; document.body.appendChild(btn); }
  btn.onclick = async ()=>{ await restoreLeftSidebar(); window.dispatchEvent(new Event("resize")); };
}

function ensureRightEdgeButton(){
  let btn = document.querySelector(".edge-toggle-right");
  if (!btn){ btn = document.createElement("button"); btn.className="edge-toggle-right"; btn.innerHTML=`Show Tools <svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`; document.body.appendChild(btn); }
  btn.onclick = async ()=>{ await restoreRightPanel(); window.dispatchEvent(new Event("resize")); };
}

(async function startApp(){
  try { await mountComponents(); setupGlobalShortcuts(); ensureLeftEdgeButton(); ensureRightEdgeButton(); console.log("%c3D Viewer App ready!","color:#4ea3ff"); }
  catch(err){ console.error("App init failed:", err); }
})();
