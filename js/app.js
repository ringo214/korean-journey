/* ================================================
   앱 코어 · 状態管理・ナビ・今日のひとこと
   ================================================ */

const STORE_KEY = "korean_journey_v3";

function todayKey(d = new Date()){
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return {done:{}, marks:{}, custom:[], memos:[], stage:0, sentences:[], bestStreak:0};
}
function save(){
  try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){}
}

let state = loadState();
["custom","memos","sentences"].forEach(k => { if(!state[k]) state[k] = []; });
if(state.stage == null) state.stage = 0;
if(!state.bestStreak) state.bestStreak = 0;
const tk = todayKey();
if(!state.done[tk]) state.done[tk] = {};

function escapeHtml(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ---------- nav ---------- */
document.querySelectorAll(".nav-btn").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    document.querySelectorAll(".page").forEach(p => p.classList.remove("on"));
    document.getElementById("page-" + b.dataset.page).classList.add("on");
    window.scrollTo({top:0});
  };
});

/* ---------- daily phrase ---------- */
let phraseIdx = (new Date().getFullYear()*372 + (new Date().getMonth()+1)*31 + new Date().getDate()) % PHRASES.length;

function renderPhrase(){
  const p = PHRASES[phraseIdx];
  document.getElementById("pKo").textContent = p.ko;
  document.getElementById("pJp").textContent = p.jp;
  document.getElementById("pNote").textContent = "💡 " + p.note;
}
document.getElementById("nextPhrase").onclick = () => {
  phraseIdx = (phraseIdx + 1) % PHRASES.length;
  renderPhrase();
};
document.getElementById("speakBtn").onclick = () => {
  const p = PHRASES[phraseIdx];
  if(!("speechSynthesis" in window)){ alert("このブラウザは読み上げに対応していません"); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(p.ko);
  u.lang = "ko-KR";
  u.rate = 0.85;
  const vs = speechSynthesis.getVoices();
  const kv = vs.find(v => v.lang && v.lang.startsWith("ko"));
  if(kv) u.voice = kv;
  speechSynthesis.speak(u);
};
if("speechSynthesis" in window){ speechSynthesis.getVoices(); }

renderPhrase();
