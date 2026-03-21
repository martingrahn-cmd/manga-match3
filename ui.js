/* ── UI Screens Mixin: Menu, Level Picker, Shop, Prep, Tutorial, Hints ── */

import { sfx } from "./audio.js";
import { BOARD_SIZE, BASE_POINTS, LEVELS, POWERUPS, COIN_REWARDS, PROGRESS_STORAGE_KEY, SHOP_STORAGE_KEY, DAILY_STORAGE_KEY, TUTORIAL_STORAGE_KEY } from "./constants.js";

export const uiMixin = {
  /* ── Main Menu ── */

  initMainMenu() {
    this.mainMenuEl = document.getElementById("mainMenu");
    this.optionsOverlay = document.getElementById("optionsOverlay");
    this.highscoreOverlay = document.getElementById("highscoreOverlay");
    this.achievementsOverlay = document.getElementById("achievementsOverlay");
    this.creditsOverlay = document.getElementById("creditsOverlay");

    document.getElementById("menuStartBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.mainMenuEl.hidden = true; this.showLevelSelect(); });
    document.getElementById("menuOptionsBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.showOptions(); });
    document.getElementById("menuHighscoreBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.showHighscores(); });
    document.getElementById("menuAchievementsBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.showAchievements(); });

    this.howtoOverlay = document.getElementById("howtoOverlay");
    document.getElementById("menuHowtoBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.howtoOverlay.hidden = false; });
    document.getElementById("menuTutorialBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.mainMenuEl.hidden = true; this.hideLevelSelect(); this.loadLevel(0); window.setTimeout(() => this.startTutorial(), 400); });
    document.getElementById("menuCreditsBtn").addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.creditsOverlay.hidden = false; });

    document.getElementById("optBackBtn").addEventListener("click", () => { sfx.uiClick(); this.optionsOverlay.hidden = true; });
    document.getElementById("hsBackBtn").addEventListener("click", () => { sfx.uiClick(); this.highscoreOverlay.hidden = true; });
    document.getElementById("achBackBtn").addEventListener("click", () => { sfx.uiClick(); this.achievementsOverlay.hidden = true; });
    document.getElementById("credBackBtn").addEventListener("click", () => { sfx.uiClick(); this.creditsOverlay.hidden = true; });
    document.getElementById("howtoBackBtn").addEventListener("click", () => { sfx.uiClick(); this.howtoOverlay.hidden = true; });

    const soundBtn = document.getElementById("optSoundBtn");
    soundBtn.textContent = sfx.muted ? "AV" : "PÅ";
    soundBtn.addEventListener("click", () => { const muted = sfx.toggleMute(); soundBtn.textContent = muted ? "AV" : "PÅ"; });

    const volRange = document.getElementById("optVolumeRange");
    volRange.value = Math.round(sfx.volume * 100);
    volRange.addEventListener("input", () => { sfx.setVolume(volRange.value / 100); });

    const resetBtn = document.getElementById("optResetBtn");
    resetBtn.addEventListener("click", () => {
      if (this.confirmReset) {
        window.localStorage.removeItem(PROGRESS_STORAGE_KEY); window.localStorage.removeItem(SHOP_STORAGE_KEY); window.localStorage.removeItem(DAILY_STORAGE_KEY); window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
        resetBtn.textContent = "Raderat!"; this.confirmReset = false;
        window.setTimeout(() => { resetBtn.textContent = "Radera"; }, 2000);
      } else {
        this.confirmReset = true; resetBtn.textContent = "Säker? Tryck igen";
        window.setTimeout(() => { if (this.confirmReset) { this.confirmReset = false; resetBtn.textContent = "Radera"; } }, 3000);
      }
    });
    this.confirmReset = false;
  },

  showMainMenu() { this.clearHint(); this.gameShellEl.hidden = true; this.closeLevelPicker(); this.levelSelectEl.hidden = true; this.mainMenuEl.hidden = false; },
  showOptions() { this.optionsOverlay.hidden = false; },

  showHighscores() {
    const list = document.getElementById("highscoreList"); list.innerHTML = "";
    const progress = this.loadProgress(); let hasAny = false;
    for (const level of LEVELS) {
      const p = progress[`level-${level.id}`]; if (!p) continue; hasAny = true;
      const row = document.createElement("div"); row.className = "highscore-row";
      let starsHtml = ""; for (let s = 0; s < 3; s++) starsHtml += s < (p.bestStars ?? 0) ? "★" : "☆";
      row.innerHTML = `<span class="highscore-row__level">${level.id}. ${level.name}</span><span class="highscore-row__stars">${starsHtml}</span><span class="highscore-row__score">${p.bestScore.toLocaleString("sv")} p</span>`;
      list.append(row);
    }
    if (!hasAny) list.innerHTML = `<p class="highscore-empty">Inga poäng ännu. Spela en bana!</p>`;
    this.highscoreOverlay.hidden = false;
  },

  showAchievements() { const list = document.getElementById("achievementsList"); list.innerHTML = `<p class="highscore-empty">Kommer snart!</p>`; this.achievementsOverlay.hidden = false; },

  /* ── Level Picker ── */

  initLevelPicker() {
    this.pickerEl = document.getElementById("levelPicker"); this.pickerGridEl = document.getElementById("levelGrid");
    this.pickerBtn = document.getElementById("pickerBtn"); this.pickerCloseBtn = document.getElementById("pickerCloseBtn"); this.pickerOpen = false;
    if (this.pickerBtn) this.pickerBtn.addEventListener("click", () => this.openLevelPicker());
    if (this.pickerCloseBtn) this.pickerCloseBtn.addEventListener("click", () => { sfx.uiClick(); this.closeLevelPicker(); this.gameShellEl.hidden = false; });
    const pickerMenuBtn = document.getElementById("pickerMenuBtn");
    if (pickerMenuBtn) pickerMenuBtn.addEventListener("click", () => { sfx.uiClick(); this.closeLevelPicker(); this.showMainMenu(); });
  },

  openLevelPicker() { this.pickerOpen = true; this.renderLevelPicker(); this.updateCoinHUD(); this.pickerEl.hidden = false; this.pickerEl.style.display = ""; },
  closeLevelPicker() { this.pickerOpen = false; this.pickerEl.hidden = true; this.pickerEl.style.display = "none"; },

  getUnlockedLevelCount() {
    const progress = this.loadProgress(); let unlocked = 1;
    for (let i = 0; i < LEVELS.length - 1; i++) { const p = progress[`level-${LEVELS[i].id}`]; if (p && p.bestStars > 0) unlocked = i + 2; else break; }
    return Math.min(unlocked, LEVELS.length);
  },

  renderLevelPicker() {
    const progress = this.loadProgress(); const unlockedCount = this.getUnlockedLevelCount(); this.pickerGridEl.innerHTML = "";
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i]; const isLocked = i >= unlockedCount; const isCurrent = i === this.levelIndex;
      const p = progress[`level-${level.id}`]; const stars = p?.bestStars ?? 0; const bestScore = p?.bestScore ?? 0;
      const card = document.createElement("button"); card.type = "button"; card.className = "level-card";
      if (isLocked) card.classList.add("level-card--locked"); else if (isCurrent) card.classList.add("level-card--current"); else if (stars > 0) card.classList.add("level-card--cleared");
      card.disabled = isLocked;
      let starsHtml = ""; for (let s = 0; s < 3; s++) starsHtml += `<span class="level-card__star ${s < stars ? "level-card__star--earned" : "level-card__star--empty"}">★</span>`;
      let detailHtml = isLocked ? `<span class="level-card__lock">🔒</span>` : bestScore > 0 ? `<span class="level-card__best">Bästa: ${bestScore.toLocaleString("sv")} p</span>` : "";
      card.innerHTML = `<span class="level-card__number">${level.id}</span><p class="level-card__name">${level.name}</p><div class="level-card__stars">${starsHtml}</div>${detailHtml}`;
      if (!isLocked) card.addEventListener("click", () => { sfx.init(); sfx.uiClick(); this.closeLevelPicker(); this.openPrepScreen(i); });
      card.style.animation = `picker-fade-in 300ms ${80 * i}ms ease-out both`;
      this.pickerGridEl.append(card);
    }
  },

  renderLevelMap() {
    this.levelMapEl.replaceChildren();
    for (let i = 0; i < LEVELS.length; i += 1) {
      const level = LEVELS[i]; const progress = this.getLevelProgress(level.id); const unlocked = this.isLevelUnlocked(i);
      const node = document.createElement("div"); node.className = `level-node${unlocked ? "" : " locked"}`;
      const num = document.createElement("span"); num.className = "level-node__number"; num.textContent = level.id;
      const name = document.createElement("span"); name.className = "level-node__name"; name.textContent = level.name;
      const stars = document.createElement("div"); stars.className = "level-node__stars"; const earned = progress?.bestStars ?? 0;
      for (let s = 0; s < 3; s += 1) { const star = document.createElement("span"); star.className = s < earned ? "star-earned" : "star-empty"; star.textContent = "★"; stars.append(star); }
      const best = document.createElement("span"); best.className = "level-node__best";
      if (unlocked && progress) best.textContent = `Bästa: ${progress.bestScore.toLocaleString("sv")} p`; else if (!unlocked) best.textContent = "";
      node.append(num, name, stars, best);
      if (unlocked) node.addEventListener("click", () => { this.hideLevelSelect(); this.loadLevel(i); });
      this.levelMapEl.append(node);
    }
  },

  /* ── Shop & Power-ups ── */

  loadShopData() { try { const raw = window.localStorage.getItem(SHOP_STORAGE_KEY); const data = raw ? JSON.parse(raw) : {}; return { coins: Math.max(0, Math.floor(data.coins ?? 0)), inventory: data.inventory ?? {} }; } catch { return { coins: 0, inventory: {} }; } },
  saveShopData() { try { window.localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(this.shopData)); } catch {} },
  getCoins() { return this.shopData.coins; },
  addCoins(amount) { this.shopData.coins = Math.max(0, this.shopData.coins + amount); this.saveShopData(); this.updateCoinHUD(); },
  getInventoryCount(powerupId) { return this.shopData.inventory[powerupId] ?? 0; },

  buyPowerup(powerupId) {
    const pu = POWERUPS.find((p) => p.id === powerupId); if (!pu || this.shopData.coins < pu.cost) return false;
    this.shopData.coins -= pu.cost; this.shopData.inventory[powerupId] = (this.shopData.inventory[powerupId] ?? 0) + 1;
    this.saveShopData(); this.updateCoinHUD(); sfx.purchase(); return true;
  },

  consumePowerup(powerupId) { if ((this.shopData.inventory[powerupId] ?? 0) <= 0) return false; this.shopData.inventory[powerupId] -= 1; if (this.shopData.inventory[powerupId] <= 0) delete this.shopData.inventory[powerupId]; this.saveShopData(); return true; },

  awardLevelCoins(stars) { const coinsByStars = [0, COIN_REWARDS.STAR_1, COIN_REWARDS.STAR_2, COIN_REWARDS.STAR_3]; const earned = coinsByStars[stars] ?? 0; if (earned > 0) this.addCoins(earned); return earned; },

  updateCoinHUD() { const el = document.getElementById("coinDisplay"); if (el) el.textContent = this.getCoins().toLocaleString("sv"); const mEl = document.getElementById("mCoins"); if (mEl) mEl.textContent = this.getCoins().toLocaleString("sv"); },

  initShop() {
    this.shopOverlay = document.getElementById("shopOverlay"); this.shopGrid = document.getElementById("shopGrid");
    this.shopCloseBtn = document.getElementById("shopCloseBtn"); this.shopCoinsEl = document.getElementById("shopCoins");
    if (this.shopCloseBtn) this.shopCloseBtn.addEventListener("click", () => this.closeShop());
    const shopBtn = document.getElementById("shopOpenBtn");
    if (shopBtn) shopBtn.addEventListener("click", (e) => { e.stopPropagation(); this.openShop(); });
  },

  openShop() { if (!this.shopOverlay) return; this.renderShop(); this.shopOverlay.hidden = false; },
  closeShop() { if (!this.shopOverlay) return; this.shopOverlay.hidden = true; },

  renderShop() {
    if (!this.shopGrid) return; this.shopCoinsEl.textContent = this.getCoins().toLocaleString("sv"); this.shopGrid.innerHTML = "";
    for (const pu of POWERUPS) {
      const owned = this.getInventoryCount(pu.id); const canAfford = this.getCoins() >= pu.cost;
      const card = document.createElement("button"); card.type = "button"; card.className = `shop-card ${canAfford ? "" : "shop-card--disabled"}`;
      card.innerHTML = `<span class="shop-card__icon">${pu.icon}</span><span class="shop-card__name">${pu.name}</span><span class="shop-card__desc">${pu.desc}</span><span class="shop-card__footer"><span class="shop-card__cost">コイン ${pu.cost}</span>${owned > 0 ? `<span class="shop-card__owned">×${owned}</span>` : ""}</span>`;
      card.addEventListener("click", () => { if (this.buyPowerup(pu.id)) { this.renderShop(); this.showComboBurst("GET!"); } });
      this.shopGrid.append(card);
    }
  },

  /* ── Prep Screen ── */

  initPrepScreen() {
    this.prepOverlay = document.getElementById("prepOverlay"); this.prepTitle = document.getElementById("prepTitle");
    this.prepGoals = document.getElementById("prepGoals"); this.prepPowerups = document.getElementById("prepPowerups");
    this.prepStartBtn = document.getElementById("prepStartBtn"); this.prepBackBtn = document.getElementById("prepBackBtn");
    if (this.prepStartBtn) this.prepStartBtn.addEventListener("click", () => this.startFromPrep());
    if (this.prepBackBtn) this.prepBackBtn.addEventListener("click", () => this.closePrepScreen());
    this.prepSelectedPowerups = [];
  },

  openPrepScreen(levelIndex) {
    this.prepLevelIndex = levelIndex; const level = LEVELS[levelIndex]; this.prepSelectedPowerups = [];
    this.prepTitle.textContent = `Bana ${level.id}: ${level.name}`;
    this.prepGoals.innerHTML = "";
    for (const goal of level.goals) { const li = document.createElement("li"); li.textContent = this.goalText(goal); this.prepGoals.append(li); }
    this.renderPrepPowerups(); this.prepOverlay.hidden = false;
  },

  renderPrepPowerups() {
    this.prepPowerups.innerHTML = ""; let hasAny = false;
    for (const pu of POWERUPS) {
      const owned = this.getInventoryCount(pu.id); if (owned <= 0) continue; hasAny = true;
      const isSelected = this.prepSelectedPowerups.includes(pu.id);
      const btn = document.createElement("button"); btn.type = "button"; btn.className = `prep-powerup ${isSelected ? "prep-powerup--active" : ""}`;
      btn.innerHTML = `<span class="prep-powerup__icon">${pu.icon}</span><span class="prep-powerup__name">${pu.name}</span><span class="prep-powerup__count">×${owned}</span>`;
      btn.addEventListener("click", () => { if (isSelected) this.prepSelectedPowerups = this.prepSelectedPowerups.filter((id) => id !== pu.id); else this.prepSelectedPowerups.push(pu.id); this.renderPrepPowerups(); });
      this.prepPowerups.append(btn);
    }
    if (!hasAny) { const msg = document.createElement("p"); msg.className = "prep-empty"; msg.textContent = "Inga power-ups. Köp i butiken!"; this.prepPowerups.append(msg); }
  },

  closePrepScreen() { this.prepOverlay.hidden = true; this.openLevelPicker(); },

  startFromPrep() {
    const activated = [];
    for (const puId of this.prepSelectedPowerups) { if (this.consumePowerup(puId)) activated.push(puId); }
    this.activePowerups = activated; this.prepOverlay.hidden = true; this.loadLevel(this.prepLevelIndex);
    if (activated.includes("extra_moves")) { this.moves += 3; this.updateHUD(); this.showComboBurst("+3 DRAG!"); }
    if (activated.includes("fever_start")) { this.addFeverCharge(50); window.setTimeout(() => this.showComboBurst("FEVER!"), 400); }
    this.updateCoinHUD(); this.renderActivePowerupBar();
  },

  /* ── Active power-up bar ── */

  renderActivePowerupBar() {
    let bar = document.getElementById("activePowerupBar");
    if (!bar) { bar = document.createElement("div"); bar.id = "activePowerupBar"; bar.className = "active-powerup-bar"; this.boardEl.parentElement.insertBefore(bar, this.boardEl); }
    bar.innerHTML = "";
    const activePUs = this.activePowerups.filter((id) => { const pu = POWERUPS.find((p) => p.id === id); return pu && pu.type === "active"; });
    if (activePUs.length === 0) { bar.hidden = true; return; }
    bar.hidden = false;
    for (const puId of activePUs) {
      const pu = POWERUPS.find((p) => p.id === puId);
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "active-pu-btn";
      btn.innerHTML = `<span class="active-pu-btn__icon">${pu.icon}</span><span class="active-pu-btn__name">${pu.name}</span>`;
      btn.addEventListener("click", () => this.usePowerup(puId)); bar.append(btn);
    }
  },

  usePowerup(puId) {
    if (this.busy || this.levelComplete) return;
    if (puId === "sensei") { this.activePowerups = this.activePowerups.filter((id) => id !== puId); this.showHint(); this.showComboBurst("SENSEI!"); this.clearHintTimeout = window.setTimeout(() => this.clearHint(), 10000); this.renderActivePowerupBar(); return; }
    if (puId === "ink_blast") { this.inkBlastPending = true; this.bomb3x3Pending = false; this.setStatus("Tryck på en bricka för att förstöra alla av den färgen!"); this.renderActivePowerupBar(); return; }
    if (puId === "bomb_3x3") { this.bomb3x3Pending = true; this.inkBlastPending = false; this.setStatus("Tryck på en ruta för att spränga 3×3!"); this.renderActivePowerupBar(); return; }
  },

  handlePowerupClick(row, col) {
    if (this.inkBlastPending) {
      this.inkBlastPending = false; const tile = this.board[row][col]; if (!tile) return false;
      const targetType = tile.type; this.activePowerups = this.activePowerups.filter((id) => id !== "ink_blast"); this.renderActivePowerupBar();
      const cleared = [];
      for (let r = 0; r < BOARD_SIZE; r++) { for (let c = 0; c < BOARD_SIZE; c++) { if (this.board[r][c] && this.board[r][c].type === targetType && !this.board[r][c].locked) { cleared.push({ row: r, col: c }); this.board[r][c] = null; } } }
      if (cleared.length > 0) {
        this.score += cleared.length * BASE_POINTS; this.showComboBurst("墨 BLAST!"); this.updateHUD(); this.render(); this.busy = true;
        window.setTimeout(async () => { await this.applyGravityAnimated(); this.fillEmptyTiles(); this.render(); await this.resolveCascade(); this.busy = false; this.render(); this.postTurnChecks(); }, 300);
      }
      return true;
    }
    if (this.bomb3x3Pending) {
      this.bomb3x3Pending = false; this.activePowerups = this.activePowerups.filter((id) => id !== "bomb_3x3"); this.renderActivePowerupBar();
      const impactSet = new Set();
      for (let dr = -1; dr <= 1; dr++) { for (let dc = -1; dc <= 1; dc++) { const nr = row + dr; const nc = col + dc; if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) { impactSet.add(this.key(nr, nc)); if (this.board[nr][nc] && !this.board[nr][nc].locked) this.board[nr][nc] = null; } } }
      this.applyImpactEffects(impactSet); this.score += 9 * BASE_POINTS; this.showComboBurst("💥 BOOM!"); this.updateHUD(); this.renderGoals(); this.render(); this.busy = true;
      window.setTimeout(async () => { await this.applyGravityAnimated(); this.fillEmptyTiles(); this.render(); await this.resolveCascade(); this.busy = false; this.render(); this.postTurnChecks(); }, 300);
      return true;
    }
    return false;
  },

  /* ── Tutorial ── */

  initTutorial() {
    this.tutOverlay = document.getElementById("tutorialOverlay"); this.tutSpotlight = document.getElementById("tutorialSpotlight");
    this.tutBubble = document.getElementById("tutorialBubble"); this.tutText = document.getElementById("tutorialText");
    this.tutBtn = document.getElementById("tutorialBtn"); this.tutSkip = document.getElementById("tutorialSkip");
    this.tutStep = -1; this.tutActive = false; this.tutPointer = null;
    this.tutBtn.addEventListener("click", () => this.tutorialNext()); this.tutSkip.addEventListener("click", () => this.tutorialEnd());
  },

  shouldShowTutorial() { try { return !window.localStorage.getItem(TUTORIAL_STORAGE_KEY); } catch { return false; } },
  markTutorialDone() { try { window.localStorage.setItem(TUTORIAL_STORAGE_KEY, "1"); } catch {} },
  isMobile() { return window.innerWidth <= 940; },

  getTutorialSteps() {
    const mobile = this.isMobile();
    return [
      { text: '<span class="tut-emoji">🌸</span> <strong>Välkommen till Manga Match!</strong><br>Matcha tre eller fler likadana brickor i rad för att samla poäng.', target: () => this.boardEl, btn: "Kör igång!" },
      { text: 'Klicka på en bricka för att <strong>välja</strong> den, sedan klicka på en <strong>granne</strong> för att byta plats. Du kan också <strong>swipa</strong> på mobil!', target: () => this.boardEl, btn: "Förstår!" },
      { text: '<span class="tut-emoji">🎯</span> Här ser du banans <strong>mål</strong>. Klara alla mål innan dragen tar slut!', target: () => mobile ? document.querySelector(".mobile-hud") || this.boardEl : document.querySelector(".goals-panel"), btn: "Nästa" },
      { text: '<span class="tut-emoji">📊</span> Håll koll på <strong>poäng</strong>, <strong>drag kvar</strong> och din <strong>combo</strong>-multiplikator här.', target: () => mobile ? document.querySelector(".mobile-hud") || this.boardEl : document.querySelector(".stat-grid"), btn: "Nästa" },
      { text: '<span class="tut-emoji">🔥</span> Bygg kedjor för att ladda <strong>Fever-mätaren</strong>! När den är full aktiveras Fever Mode med bonuspoäng.', target: () => mobile ? this.boardEl : document.querySelector(".fever-panel"), btn: "Nästa" },
      { text: 'Matcha <strong>4 i rad</strong> för en linjeattack, <strong>5 i rad</strong> för färgbomb, och <strong>T/L-form</strong> för en bomb! Kombinera special-brickor för maximal effekt.', target: () => this.boardEl, btn: "Nästa" },
      { text: '<span class="tut-emoji">⭐</span> Ju fler drag du har kvar, desto fler <strong>stjärnor</strong> får du! Sikta på 3 stjärnor för varje bana.', target: () => this.boardEl, btn: "Spela!" },
    ];
  },

  startTutorial() {
    if (!this.tutOverlay) this.initTutorial();
    this.tutActive = true; this.tutStep = -1; this.tutOverlay.hidden = false; this.tutOverlay.style.display = "";
    this.tutSpotlight.style.boxShadow = ""; this.clearHint(); this.tutorialNext();
  },

  tutorialNext() {
    const steps = this.getTutorialSteps(); this.tutStep += 1;
    if (this.tutStep >= steps.length) { this.tutorialEnd(); return; }
    const step = steps[this.tutStep]; this.tutText.innerHTML = step.text; this.tutBtn.textContent = step.btn || "Nästa";
    const targetEl = step.target();
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect(); const vh = window.innerHeight; const vw = window.innerWidth;
      const inView = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
      if (inView) {
        const pad = 8;
        this.tutSpotlight.style.top = `${rect.top - pad}px`; this.tutSpotlight.style.left = `${rect.left - pad}px`;
        this.tutSpotlight.style.width = `${rect.width + pad * 2}px`; this.tutSpotlight.style.height = `${rect.height + pad * 2}px`;
        this.tutSpotlight.style.display = ""; this.positionBubble(rect);
      } else {
        this.tutSpotlight.style.display = "none";
        const bubbleW = Math.min(340, vw * 0.88);
        this.tutBubble.classList.remove("tutorial-bubble--above");
        this.tutBubble.style.top = `${Math.round(vh * 0.35)}px`; this.tutBubble.style.bottom = "auto";
        this.tutBubble.style.left = `${Math.round((vw - bubbleW) / 2)}px`;
      }
    }
    this.tutBubble.style.animation = "none"; void this.tutBubble.offsetHeight; this.tutBubble.style.animation = "";
  },

  positionBubble(targetRect) {
    const bubbleW = Math.min(340, window.innerWidth * 0.88); const gap = 18;
    const spaceBelow = window.innerHeight - targetRect.bottom; const spaceAbove = targetRect.top;
    this.tutBubble.classList.remove("tutorial-bubble--above");
    if (spaceBelow > 200) { this.tutBubble.style.top = `${targetRect.bottom + gap}px`; this.tutBubble.style.bottom = "auto"; this.tutBubble.classList.add("tutorial-bubble--above"); }
    else if (spaceAbove > 200) { this.tutBubble.style.top = "auto"; this.tutBubble.style.bottom = `${window.innerHeight - targetRect.top + gap}px`; }
    else { this.tutBubble.style.top = `${Math.max(20, targetRect.top - 160)}px`; this.tutBubble.style.bottom = "auto"; }
    const idealLeft = targetRect.left + targetRect.width / 2 - bubbleW / 2;
    const clampedLeft = Math.max(12, Math.min(idealLeft, window.innerWidth - bubbleW - 12));
    this.tutBubble.style.left = `${clampedLeft}px`;
    const tailTarget = targetRect.left + targetRect.width / 2 - clampedLeft;
    const tail = this.tutBubble.querySelector(".tutorial-bubble__tail");
    if (tail) tail.style.left = `${Math.max(20, Math.min(tailTarget - 10, bubbleW - 40))}px`;
  },

  tutorialEnd() {
    this.tutActive = false; this.tutOverlay.hidden = true; this.tutOverlay.style.display = "none";
    this.tutSpotlight.style.boxShadow = "none"; this.markTutorialDone(); this.render(); this.scheduleHint();
    if (this.pickerBtn) this.pickerBtn.hidden = false;
  },

  maybeTutorial() { if (this.levelIndex === 0 && this.shouldShowTutorial()) window.setTimeout(() => this.startTutorial(), 600); },

  /* ── Hints ── */

  scheduleHint() {
    this.clearHint();
    if (this.busy || this.levelComplete || this.tutActive) return;
    this.hintTimer = window.setTimeout(() => { this.hintTimer = null; this.showHint(); }, 12000);
  },

  clearHint() {
    if (this.hintTimer) { window.clearTimeout(this.hintTimer); this.hintTimer = null; }
    for (const node of this.hintedCells) node.classList.remove("hint");
    this.hintedCells = [];
  },

  showHint() {
    if (this.busy || this.levelComplete) return;
    sfx.hint(); const move = this.findHintMove(); if (!move) return;
    for (const pos of move) { const node = this.getCellNode(pos.row, pos.col); if (node) { node.classList.add("hint"); this.hintedCells.push(node); } }
  },
};
