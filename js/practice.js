/* ================================================
   연습 도구 · タイマー・録音・音源プレーヤー
   ================================================ */

/* ---------- timer ---------- */
let timerSec = 300, timerLeft = 300, timerInt = null;
const timerNum = document.getElementById("timerNum");

function fmtT(s){ return Math.floor(s/60) + ":" + String(s%60).padStart(2,"0"); }
function renderTimer(){
  timerNum.textContent = fmtT(timerLeft);
  timerNum.classList.toggle("running", !!timerInt);
}

document.getElementById("timerStart").onclick = function(){
  if(timerInt){
    clearInterval(timerInt); timerInt = null;
    this.textContent = "つづける"; renderTimer(); return;
  }
  this.textContent = "一時停止";
  timerInt = setInterval(() => {
    timerLeft--;
    if(timerLeft <= 0){
      clearInterval(timerInt); timerInt = null; timerLeft = 0;
      document.getElementById("timerStart").textContent = "はじめる";
      timerNum.textContent = "끝! 🎉";
      setTimeout(() => { timerLeft = timerSec; renderTimer(); }, 2500);
      return;
    }
    renderTimer();
  }, 1000);
  renderTimer();
};
document.getElementById("timerReset").onclick = () => {
  clearInterval(timerInt); timerInt = null; timerLeft = timerSec;
  document.getElementById("timerStart").textContent = "はじめる"; renderTimer();
};
[["timer3",180],["timer5",300],["timer10",600]].forEach(([id, s]) => {
  document.getElementById(id).onclick = () => {
    clearInterval(timerInt); timerInt = null; timerSec = s; timerLeft = s;
    document.getElementById("timerStart").textContent = "はじめる"; renderTimer();
  };
});
renderTimer();

/* ---------- recorder ---------- */
let mediaRec = null, chunks = [];
const recBtn = document.getElementById("recBtn");
const recStop = document.getElementById("recStop");
const recStatus = document.getElementById("recStatus");
const recAudio = document.getElementById("recAudio");

recBtn.onclick = async () => {
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    recStatus.textContent = "このブラウザは録音に対応していません"; return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    mediaRec = new MediaRecorder(stream);
    chunks = [];
    mediaRec.ondataavailable = e => chunks.push(e.data);
    mediaRec.onstop = () => {
      const blob = new Blob(chunks, {type: mediaRec.mimeType || "audio/webm"});
      recAudio.src = URL.createObjectURL(blob);
      recAudio.classList.add("on");
      recStatus.textContent = "録音完了。お手本と聞き比べてみよう";
      recStatus.classList.remove("on");
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRec.start();
    recBtn.style.display = "none";
    recStop.style.display = "inline-block";
    recStatus.innerHTML = '<span class="rec-dot"></span>録音中… 韓国語を声に出して';
    recStatus.classList.add("on");
  }catch(err){
    recStatus.textContent = "マイクの使用が許可されませんでした";
  }
};
recStop.onclick = () => {
  if(mediaRec && mediaRec.state !== "inactive") mediaRec.stop();
  recBtn.style.display = "inline-block";
  recStop.style.display = "none";
};

/* ---------- audio player + A-B repeat ---------- */
const fileIn = document.getElementById("fileIn");
const audio = document.getElementById("audio");
const np = document.getElementById("np");
const npName = document.getElementById("npName");
let ptA = null, ptB = null, looping = false;

fileIn.onchange = e => {
  const f = e.target.files[0];
  if(!f) return;
  audio.src = URL.createObjectURL(f);
  npName.textContent = "♪ " + f.name;
  np.classList.add("on");
  ptA = ptB = null; looping = false; updateAB();
  audio.play().catch(() => {});
};

const setA = document.getElementById("setA");
const setB = document.getElementById("setB");
const loopBtn = document.getElementById("loopBtn");
const clearABBtn = document.getElementById("clearAB");
const abInfo = document.getElementById("abInfo");

function fmtTime(t){
  if(t == null) return "—";
  const mm = Math.floor(t/60), ss = Math.floor(t%60);
  return mm + ":" + String(ss).padStart(2,"0");
}
function updateAB(){
  setA.classList.toggle("set", ptA != null);
  setB.classList.toggle("set", ptB != null);
  loopBtn.classList.toggle("set", looping);
  abInfo.innerHTML = (ptA != null || ptB != null)
    ? `A <span>${fmtTime(ptA)}</span> → B <span>${fmtTime(ptB)}</span> ${looping ? '· リピート中' : ''}`
    : "A・B を決めると、その区間だけ繰り返せます。";
}
setA.onclick = () => { ptA = audio.currentTime; if(ptB != null && ptB <= ptA) ptB = null; updateAB(); };
setB.onclick = () => { ptB = audio.currentTime; if(ptA != null && ptA >= ptB) ptA = null; updateAB(); };
loopBtn.onclick = () => {
  if(ptA == null || ptB == null){ abInfo.textContent = "先に A と B の地点を決めてね。"; return; }
  looping = !looping;
  if(looping && (audio.currentTime < ptA || audio.currentTime > ptB)) audio.currentTime = ptA;
  updateAB();
  if(looping) audio.play().catch(() => {});
};
clearABBtn.onclick = () => { ptA = ptB = null; looping = false; updateAB(); };
audio.ontimeupdate = () => {
  if(looping && ptA != null && ptB != null && audio.currentTime >= ptB){
    audio.currentTime = ptA;
  }
};
document.querySelectorAll(".spd").forEach(b => {
  b.onclick = () => {
    document.querySelectorAll(".spd").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    audio.playbackRate = parseFloat(b.dataset.s);
  };
});
updateAB();
