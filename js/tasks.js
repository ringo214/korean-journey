/* ================================================
   체크리스트・기록 · チェックリスト・連続記録・カレンダー・ロードマップ
   ================================================ */

/* ---------- checklist ---------- */
const taskList = document.getElementById("taskList");

function allTasks(){
  return DEFAULT_TASKS.concat(state.custom.map(c => ({id:c.id, ko:c.text, jp:"", mins:"", custom:true})));
}

function renderTasks(){
  taskList.innerHTML = "";
  allTasks().forEach(t => {
    const done = !!state.done[tk][t.id];
    const el = document.createElement("div");
    el.className = "task" + (done ? " done" : "");
    el.innerHTML = `
      <div class="check"><svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg></div>
      <div class="body"><div class="t-ko">${t.ko}</div>${t.jp?`<div class="t-jp">${t.jp}</div>`:""}</div>
      ${t.mins?`<div class="mins">${t.mins}</div>`:""}
      ${t.custom?`<div class="del" data-id="${t.id}">✕</div>`:""}`;
    el.onclick = (ev) => {
      if(ev.target.classList.contains("del")){
        state.custom = state.custom.filter(c => c.id !== t.id);
        delete state.done[tk][t.id];
        save(); renderTasks(); syncMark(); return;
      }
      state.done[tk][t.id] = !state.done[tk][t.id];
      save(); renderTasks(); syncMark();
    };
    taskList.appendChild(el);
  });
}

function syncMark(){
  const anyDone = Object.values(state.done[tk]).some(v => v);
  if(anyDone) state.marks[tk] = true; else delete state.marks[tk];
  save(); renderStreak(); renderCal(); renderBadges();
}

document.getElementById("addTaskBtn").onclick = addCustom;
document.getElementById("newTaskIn").addEventListener("keydown", e => { if(e.key === "Enter") addCustom(); });
function addCustom(){
  const inp = document.getElementById("newTaskIn");
  const v = inp.value.trim();
  if(!v) return;
  state.custom.push({id:"c"+Date.now(), text:v});
  inp.value = "";
  save(); renderTasks();
}

/* ---------- streak & badges ---------- */
function currentStreak(){
  const marks = state.marks;
  let streak = 0, d = new Date();
  if(!marks[todayKey(d)]) d.setDate(d.getDate()-1);
  while(marks[todayKey(d)]){ streak++; d.setDate(d.getDate()-1); }
  return streak;
}

function renderStreak(){
  const total = Object.keys(state.marks).length;
  document.getElementById("totalDays").textContent = "これまで " + total + " 日";
  document.getElementById("streakNum").textContent = currentStreak();
}

function renderBadges(){
  const box = document.getElementById("badges");
  const s = currentStreak();
  if(s > state.bestStreak){ state.bestStreak = s; save(); }
  const best = state.bestStreak;
  box.innerHTML = "";
  MILESTONES.forEach(m => {
    const el = document.createElement("div");
    el.className = "badge" + (best >= m.days ? " won" : "");
    el.textContent = m.label;
    el.title = m.jp + (best >= m.days ? "・獲得済み" : "・" + m.days + "日連続で解放");
    box.appendChild(el);
  });
}

/* ---------- calendar ---------- */
let viewDate = new Date();
const calGrid = document.getElementById("calGrid");
const DOW = ["日","月","火","水","木","金","土"];

function renderCal(){
  const y = viewDate.getFullYear(), m = viewDate.getMonth();
  document.getElementById("mlabel").textContent = y + "년 " + (m+1) + "월";
  calGrid.innerHTML = "";
  DOW.forEach(d => { const e = document.createElement("div"); e.className = "dow"; e.textContent = d; calGrid.appendChild(e); });
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m+1, 0).getDate();
  for(let i = 0; i < first; i++){ const e = document.createElement("div"); e.className = "day empty"; calGrid.appendChild(e); }
  for(let dn = 1; dn <= days; dn++){
    const key = y + "-" + String(m+1).padStart(2,"0") + "-" + String(dn).padStart(2,"0");
    const e = document.createElement("div");
    e.className = "day cur";
    if(key === todayKey()) e.classList.add("today");
    if(state.marks[key]) e.classList.add("marked");
    e.textContent = dn;
    calGrid.appendChild(e);
  }
}
document.getElementById("prevM").onclick = () => { viewDate.setMonth(viewDate.getMonth()-1); renderCal(); };
document.getElementById("nextM").onclick = () => { viewDate.setMonth(viewDate.getMonth()+1); renderCal(); };

/* ---------- roadmap ---------- */
function renderRoad(){
  const box = document.getElementById("roadBox");
  box.innerHTML = "";
  ROAD_STEPS.forEach((s, i) => {
    const active = i === state.stage;
    const el = document.createElement("div");
    el.className = "step" + (active ? " active" : "");
    el.innerHTML = `
      <div class="node"></div>
      ${active
        ? '<span class="s-now">지금 여기 · 今ここ</span>'
        : `<span class="s-set">ここに進む</span>`}
      <div class="s-ko">${s.ko}</div>
      <div class="s-jp">${s.jp}</div>
      <div class="s-desc">${s.desc}</div>`;
    const setBtn = el.querySelector(".s-set");
    if(setBtn) setBtn.onclick = () => { state.stage = i; save(); renderRoad(); };
    box.appendChild(el);
  });
}

/* ---------- memo ---------- */
const memoList = document.getElementById("memoList");
function renderMemos(){
  memoList.innerHTML = "";
  if(state.memos.length === 0){
    memoList.innerHTML = '<div class="memo-empty">まだメモがありません。今日出会った言葉をひとつ。</div>';
    return;
  }
  state.memos.slice().reverse().forEach((m, revIdx) => {
    const idx = state.memos.length - 1 - revIdx;
    const el = document.createElement("div");
    el.className = "memo-item";
    el.innerHTML = `<span class="mtxt">${escapeHtml(m)}</span><span class="mdel">✕</span>`;
    el.querySelector(".mdel").onclick = () => {
      state.memos.splice(idx, 1);
      save(); renderMemos();
    };
    memoList.appendChild(el);
  });
}
document.getElementById("memoBtn").onclick = addMemo;
document.getElementById("memoIn").addEventListener("keydown", e => { if(e.key === "Enter") addMemo(); });
function addMemo(){
  const inp = document.getElementById("memoIn");
  const v = inp.value.trim();
  if(!v) return;
  state.memos.push(v);
  inp.value = "";
  save(); renderMemos();
}

/* ---------- phrase reference ---------- */
const refList = document.getElementById("refList");
REF_GROUPS.forEach(g => {
  const el = document.createElement("div");
  el.className = "ref-group";
  el.innerHTML = `
    <div class="ref-head">
      <span class="rk">${g.ko}</span>
      <span class="rj">${g.jp}</span>
      <span class="arrow">›</span>
    </div>
    <div class="ref-body">${g.body}</div>`;
  el.querySelector(".ref-head").onclick = () => el.classList.toggle("open");
  refList.appendChild(el);
});

/* ---------- reset ---------- */
document.getElementById("resetBtn").onclick = () => {
  if(confirm("すべての練習記録・カレンダー・メモ・作文履歴を消します。よろしいですか？")){
    state = {done:{}, marks:{}, custom:[], memos:[], stage:0, sentences:[], bestStreak:0};
    state.done[tk] = {};
    save();
    renderTasks(); renderStreak(); renderCal(); renderBadges(); renderMemos(); renderRoad(); renderHist();
  }
};

/* ---------- init ---------- */
renderTasks();
renderStreak();
renderBadges();
renderCal();
renderRoad();
renderMemos();
