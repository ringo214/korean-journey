/* ================================================
   작문 · 1日1文＋AI添削
   添削リクエストは Cloudflare Worker (config.js の WORKER_URL) 経由。
   APIキーはこのコードには存在しない（Worker側の環境変数にだけある）。
   ================================================ */

const correctBtn = document.getElementById("correctBtn");
const writeLoading = document.getElementById("writeLoading");
const correctionBox = document.getElementById("correction");
const correctionBody = document.getElementById("correctionBody");

correctBtn.onclick = async () => {
  const text = document.getElementById("writeIn").value.trim();
  if(!text){ alert("まず1文書いてみて！"); return; }

  if(!CONFIG.WORKER_URL){
    correctionBody.textContent = "添削機能はまだ設定されていません。SETUP.md の手順で Worker URL を config.js に設定してください。";
    correctionBox.classList.add("on");
    return;
  }

  correctBtn.disabled = true;
  writeLoading.classList.add("on");
  correctionBox.classList.remove("on");

  try{
    const res = await fetch(CONFIG.WORKER_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ sentence: text })
    });
    const data = await res.json();

    if(data && data.correction){
      correctionBody.textContent = data.correction;
      correctionBox.classList.add("on");
      // save to history
      state.sentences.push({date: todayKey(), text: text});
      if(state.sentences.length > 60) state.sentences = state.sentences.slice(-60);
      save(); renderHist();
      // auto-check the writing task
      if(!state.done[tk]["write"]){
        state.done[tk]["write"] = true;
        save(); renderTasks(); syncMark();
      }
    }else if(data && data.error){
      correctionBody.textContent = "エラー: " + data.error;
      correctionBox.classList.add("on");
    }else{
      correctionBody.textContent = "うまく添削を受け取れませんでした。もう一度試してみて。";
      correctionBox.classList.add("on");
    }
  }catch(err){
    correctionBody.textContent = "通信エラー。WORKER_URL の設定と、ネット接続を確認してみて。";
    correctionBox.classList.add("on");
  }

  correctBtn.disabled = false;
  writeLoading.classList.remove("on");
};

function renderHist(){
  const box = document.getElementById("histBox");
  if(state.sentences.length === 0){
    box.innerHTML = '<div class="hist-empty">まだ記録がありません。1文目を書いてみよう。</div>';
    return;
  }
  box.innerHTML = "";
  state.sentences.slice().reverse().slice(0, 30).forEach(s => {
    const el = document.createElement("div");
    el.className = "hist-item";
    el.innerHTML = `<div class="h-date">${s.date}</div><div class="h-sent">${escapeHtml(s.text)}</div>`;
    box.appendChild(el);
  });
}

renderHist();
