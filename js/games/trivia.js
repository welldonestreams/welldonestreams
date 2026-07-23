window.Games.trivia = function () {
  const stage = document.getElementById('game-stage');
  stage.innerHTML = `
    <div class="table-felt" style="background: radial-gradient(circle, #14532d 0%, #052e16 100%); max-width: 640px; margin: 0 auto;">
      <h2>🧠 Brain Bets</h2>
      <p id="tv-intro" style="opacity:.8; font-size:.9rem; margin-top:-6px;">15 seconds per question. Questions rotate without immediate repeats. Winnings bank into a POT. After each correct answer: CASH OUT — or risk it on the next question for 50% MORE coins. One wrong answer, or not answering in time torches the entire pot. Always free to play, even flat broke.</p>
      <div style="display:flex; gap:18px; justify-content:center; margin:10px 0; font-weight:800; font-size:1.05rem;">
        <span id="tv-pot">💰 Pot: 0</span>
        <span id="tv-streak">🔥 Streak: 0</span>
      </div>
      <div id="tv-timerwrap" style="height:10px; background:rgba(255,255,255,.15); border-radius:999px; overflow:hidden; margin:0 0 16px;">
        <div id="tv-timer" style="height:100%; width:100%; background:#eab308; border-radius:999px; transition: width 1s linear;"></div>
      </div>
      <div id="tv-question" style="font-size:1.35rem; font-weight:700; min-height:60px; margin-bottom:14px;">Ready to climb back from zero?</div>
      <input type="text" id="tv-answer" class="bet-input" style="width:min(90%,340px); text-align:center;" placeholder="Your answer" autocomplete="off" />
      <br>
      <button class="pill" id="tv-submit" style="margin-top:12px;">Submit</button>
      <div style="margin-top:12px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        <button class="pill" id="tv-cashout" style="display:none;">💰 Cash Out</button>
        <button class="pill secondary" id="tv-next">Start</button>
      </div>
      <p id="tv-msg" style="margin-top:14px; font-weight:bold; min-height:48px;"></p>
    </div>
  `;

  const qEl = document.getElementById('tv-question');
  const ansEl = document.getElementById('tv-answer');
  const submitBtn = document.getElementById('tv-submit');
  const nextBtn = document.getElementById('tv-next');
  const cashBtn = document.getElementById('tv-cashout');
  const msgEl = document.getElementById('tv-msg');
  const streakEl = document.getElementById('tv-streak');
  const potEl = document.getElementById('tv-pot');
  const timerEl = document.getElementById('tv-timer');

  let timerInt = null;
  const ROUND_SECONDS = 15;
  let secondsLeft = ROUND_SECONDS;
  let active = false;
  let pot = 0;

  function fmt(n) { return Number(n || 0).toLocaleString(); }
  function setStreak(n) { streakEl.textContent = `🔥 Streak: ${n}`; }
  function setPot(n) { pot = n; potEl.textContent = `💰 Pot: ${fmt(n)}`; cashBtn.textContent = `💰 Cash Out ${fmt(n)}`; }
  function stopTimer() { if (timerInt) { clearInterval(timerInt); timerInt = null; } }

  function startTimer() {
    secondsLeft = ROUND_SECONDS;
    timerEl.style.transition = 'none';
    timerEl.style.width = '100%';
    void timerEl.offsetWidth;
    timerEl.style.transition = 'width 1s linear';
    stopTimer();
    timerInt = setInterval(() => {
      secondsLeft--;
      timerEl.style.width = Math.max(0, (secondsLeft / ROUND_SECONDS) * 100) + '%';
      if (secondsLeft <= 0) {
        stopTimer();
        submitAnswer(true); // auto-submit blank -> server settles the forfeit
      }
    }, 1000);
  }

  function showRoundButtons(state) {
    // state: 'question' | 'won' | 'lost' | 'idle'
    submitBtn.style.display = state === 'question' ? 'inline-flex' : 'none';
    ansEl.style.display = state === 'question' ? 'inline-block' : 'none';
    cashBtn.style.display = state === 'won' ? 'inline-flex' : 'none';
    nextBtn.style.display = state === 'question' ? 'none' : 'inline-flex';
    if (state === 'won') nextBtn.textContent = '▶ Risk It — Next Question';
    else if (state === 'lost') nextBtn.textContent = 'Start Over';
    else nextBtn.textContent = 'Start';
  }

  async function loadQuestion() {
    const intro = document.getElementById('tv-intro');
    if (intro) intro.remove();   // rules disappear once you're actually playing
    stopTimer();
    msgEl.textContent = '';
    ansEl.value = '';
    qEl.textContent = 'Loading…';
    showRoundButtons('question');
    submitBtn.disabled = true;
    ansEl.disabled = true;
    try {
      const d = await window.GameAPI.request('/trivia-question');
      qEl.textContent = d.question;
      setStreak(d.streak || 0);
      setPot(d.pot || 0);
      active = true;
      ansEl.disabled = false;
      submitBtn.disabled = false;
      ansEl.focus();
      startTimer();
    } catch (e) {
      qEl.textContent = 'Could not load a question.';
      msgEl.style.color = '#f87171';
      msgEl.textContent = e.message;
      showRoundButtons('idle');
      nextBtn.textContent = 'Retry';
    }
  }

  async function submitAnswer(isTimeout) {
    if (!active) return;
    const answer = isTimeout ? '' : ansEl.value.trim();
    if (!answer && !isTimeout) { msgEl.style.color = '#f87171'; msgEl.textContent = 'Type an answer first.'; return; }
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
        setPot(d.pot);
        msgEl.style.color = '#4ade80';
        msgEl.textContent = `✅ Correct! +${fmt(d.reward)} banked. Pot is ${fmt(d.pot)} — cash out or risk it?`;
        showRoundButtons('won');
        nextBtn.focus();
      } else {
        const lost = d.lostPot || 0;
        setPot(0);
        msgEl.style.color = '#f87171';
        if (d.timeout) {
          msgEl.textContent = lost > 0
            ? `⏰ ${d.message || "Time's up!"} You forfeited a pot of ${fmt(lost)}.`
            : `⏰ ${d.message || "Time's up!"}${d.answer ? ` The answer was "${d.answer}".` : ''}`;
        } else {
          msgEl.textContent = lost > 0
            ? `❌ Wrong — the answer was "${d.answer}". Pot of ${fmt(lost)} gone.`
            : `❌ Wrong — the answer was "${d.answer}".`;
        }
        showRoundButtons('lost');
      }
    } catch (e) {
      msgEl.style.color = '#f87171';
      msgEl.textContent = e.message;
      showRoundButtons('idle');
    }
  }

  async function cashOut() {
    cashBtn.disabled = true;
    try {
      const d = await window.GameAPI.request('/trivia-cashout', { method: 'POST' });
      window.GameAPI.cachedBalance = d.newBalance;
      window.GameAPI.updateBalanceUI();
      CasinoShared.playSound('win');
      setPot(0);
      setStreak(0);
      msgEl.style.color = '#4ade80';
      msgEl.textContent = `💰 Cashed out ${fmt(d.cashedOut)} chips!`;
      showRoundButtons('idle');
      nextBtn.textContent = 'Play Again';
    } catch (e) {
      msgEl.style.color = '#f87171';
      msgEl.textContent = e.message;
    } finally {
      cashBtn.disabled = false;
    }
  }

  submitBtn.addEventListener('click', () => submitAnswer(false));
  ansEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(false); });
  nextBtn.addEventListener('click', loadQuestion);
  cashBtn.addEventListener('click', cashOut);

  showRoundButtons('idle');

  CasinoShared.addGameInfo(stage, {
    title: 'More info',
    html: `
      <p>Questions include easy general knowledge, pop culture, games, animals, food, sports, and quick math. The Worker prevents the immediately previous question from appearing again.</p>
      <p>Math prompts use two-digit numbers, except addition, which may use three-digit numbers. You have 15 seconds to answer.</p>
      <p>Correct answers grow the pot. Cash out whenever you like; a wrong answer, timeout, or skipped active question loses the current pot.</p>`
  });
};
