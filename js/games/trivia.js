window.Games.trivia = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt" style="background: radial-gradient(circle, #14532d 0%, #052e16 100%); max-width: 640px; margin: 0 auto;">
      <h2>🧠 Brain Bets</h2>
      <p style="opacity:.8; font-size:.9rem; margin-top:-6px;">Answer in 20 seconds. Base 500 chips — each correct in a row pays 50% more. Wrong, slow, or skipping resets the streak.</p>
      <div id="tv-streak" style="font-weight:800; margin:10px 0; font-size:1.05rem;">🔥 Streak: 0</div>
      <div id="tv-timerwrap" style="height:10px; background:rgba(255,255,255,.15); border-radius:999px; overflow:hidden; margin:0 0 16px;">
        <div id="tv-timer" style="height:100%; width:100%; background:#eab308; border-radius:999px; transition: width 1s linear;"></div>
      </div>
      <div id="tv-question" style="font-size:1.35rem; font-weight:700; min-height:60px; margin-bottom:14px;">Ready?</div>
      <input type="text" id="tv-answer" class="bet-input" style="width:min(90%,340px); text-align:center;" placeholder="Your answer" autocomplete="off" />
      <br>
      <button class="pill" id="tv-submit" style="margin-top:12px;">Submit</button>
      <button class="pill secondary" id="tv-next" style="margin-top:12px;">Start</button>
      <p id="tv-msg" style="margin-top:14px; font-weight:bold; min-height:48px;"></p>
    </div>
  `;

  const qEl = document.getElementById('tv-question');
  const ansEl = document.getElementById('tv-answer');
  const submitBtn = document.getElementById('tv-submit');
  const nextBtn = document.getElementById('tv-next');
  const msgEl = document.getElementById('tv-msg');
  const streakEl = document.getElementById('tv-streak');
  const timerEl = document.getElementById('tv-timer');

  let timerInt = null;
  let secondsLeft = 20;
  let active = false;

  function setStreak(n) { streakEl.textContent = `🔥 Streak: ${n}`; }

  function stopTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }

  function startTimer() {
    secondsLeft = 20;
    timerEl.style.transition = 'none';
    timerEl.style.width = '100%';
    // force reflow so the reset applies before animating
    void timerEl.offsetWidth;
    timerEl.style.transition = 'width 1s linear';
    stopTimer();
    timerInt = setInterval(() => {
      secondsLeft--;
      timerEl.style.width = Math.max(0, (secondsLeft / 20) * 100) + '%';
      if (secondsLeft <= 0) {
        stopTimer();
        active = false;
        submitBtn.disabled = true;
        ansEl.disabled = true;
        msgEl.style.color = '#f87171';
        msgEl.textContent = "⏰ Time's up! Streak lost. Grab the next one.";
        setStreak(0);
        nextBtn.textContent = 'Next Question';
        nextBtn.style.display = 'inline-flex';
      }
    }, 1000);
  }

  async function loadQuestion() {
    stopTimer();
    msgEl.textContent = '';
    ansEl.value = '';
    ansEl.disabled = true;
    submitBtn.disabled = true;
    nextBtn.style.display = 'none';
    qEl.textContent = 'Loading…';
    try {
      const d = await window.GameAPI.request('/trivia-question');
      qEl.textContent = d.question;
      setStreak(d.streak || 0);
      active = true;
      ansEl.disabled = false;
      submitBtn.disabled = false;
      ansEl.focus();
      startTimer();
    } catch (e) {
      qEl.textContent = 'Could not load a question.';
      msgEl.style.color = '#f87171';
      msgEl.textContent = e.message;
      nextBtn.textContent = 'Retry';
      nextBtn.style.display = 'inline-flex';
    }
  }

  async function submitAnswer() {
    if (!active) return;
    const answer = ansEl.value.trim();
    if (!answer) { msgEl.style.color = '#f87171'; msgEl.textContent = 'Type an answer first.'; return; }
    active = false;
    stopTimer();
    submitBtn.disabled = true;
    ansEl.disabled = true;
    try {
      const d = await window.GameAPI.request('/trivia-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer })
      });
      if (typeof d.newBalance === 'number') {
        window.GameAPI.cachedBalance = d.newBalance;
        window.GameAPI.updateBalanceUI();
      }
      setStreak(d.streak || 0);
      if (d.correct) {
        CasinoShared.playSound('win');
        msgEl.style.color = '#4ade80';
        msgEl.textContent = `✅ Correct! +${d.reward.toLocaleString()} chips (streak ${d.streak})`;
      } else if (d.timeout) {
        msgEl.style.color = '#f87171';
        msgEl.textContent = d.message || "Time's up! Streak reset.";
      } else {
        msgEl.style.color = '#f87171';
        msgEl.textContent = `❌ Nope — the answer was "${d.answer}". Streak reset.`;
      }
    } catch (e) {
      msgEl.style.color = '#f87171';
      msgEl.textContent = e.message;
    }
    nextBtn.textContent = 'Next Question';
    nextBtn.style.display = 'inline-flex';
    nextBtn.focus();
  }

  submitBtn.addEventListener('click', submitAnswer);
  ansEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(); });
  nextBtn.addEventListener('click', loadQuestion);
};