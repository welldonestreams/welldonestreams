const API = "https://welldonestreams-api.chanceweldon11.workers.dev/api";

const GameAPI = {
  async getBalance() {
    let bal = parseInt(localStorage.getItem('fake_stake_balance') || '1000', 10);
    return bal;
  },
  async setBalance(amount) {
    localStorage.setItem('fake_stake_balance', amount);
    if (window.UI) window.UI.updateBalance(amount);
    return amount;
  },
  async claimDaily() {
    let last = localStorage.getItem('fake_stake_daily') || 0;
    let now = Date.now();
    if (now - last < 86400000) {
      alert("Daily reward already claimed! Check back tomorrow.");
      return;
    }
    let current = await this.getBalance();
    let nextBal = current + 250;
    localStorage.setItem('fake_stake_daily', now);
    await this.setBalance(nextBal);
    alert("Claimed +250 daily chips!");
  }
};
window.GameAPI = GameAPI;
