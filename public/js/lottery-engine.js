// Slack Pick Studio Lottery & Team Divider Engine

const LotteryEngine = {
  isRolling: false,
  rollAnimTimer: null,
  reelY: 0,

  // 1명씩 쾌속 룰렛 추첨 (약 1.1초 쫄깃 애니메이션)
  pickSingleWinner(runners, elements, onComplete) {
    if (this.isRolling || !runners || runners.length === 0) return;
    this.isRolling = true;

    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '🎰 룰렛 돌리는 중... 틱틱틱!';

    // 무작위 1명 당첨자 선정 및 릴 무작위 셔플
    const winnerIndex = Math.floor(Math.random() * runners.length);
    const winner = runners[winnerIndex];

    // 🎲 릴 카드 순서를 100% 무작위 셔플!
    const shuffledReelRunners = [...runners].sort(() => Math.random() - 0.5);

    // 슬롯 릴 카드 바인딩
    let reelCardsHtml = '';
    for (let i = 0; i < 6; i++) {
      shuffledReelRunners.forEach(u => {
        reelCardsHtml += `
          <div class="picker-card-2d">
            <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
            <span class="card-name">${u.real_name || u.name}</span>
          </div>
        `;
      });
    }
    rouletteReelContainer.innerHTML = reelCardsHtml;

    let startTime = Date.now();
    let duration = 1100; // 1.1초 쾌속 추첨
    const self = this;

    function rollLoop() {
      if (!self.isRolling) return;
      let elapsed = Date.now() - startTime;
      let progress = elapsed / duration;

      if (progress < 1) {
        let speed = Math.max(3, 40 * (1 - Math.pow(progress, 2)));
        self.reelY -= speed;
        if (Math.abs(self.reelY) > 1000) self.reelY = 0;
        rouletteReelContainer.style.transform = `translateY(${self.reelY}px)`;
        self.rollAnimTimer = requestAnimationFrame(rollLoop);
      } else {
        self.finishSingleWinner(winner, runners, elements, onComplete);
      }
    }
    rollLoop();
  },

  finishSingleWinner(winner, runners, elements, onComplete) {
    this.isRolling = false;
    if (this.rollAnimTimer) cancelAnimationFrame(this.rollAnimTimer);
    
    const { rouletteReelContainer, commentaryText } = elements;
    commentaryText.textContent = `🎉 [${winner.real_name || winner.name}] 님 당첨!`;

    // 🚨 당첨자(winner) 및 이미 추첨 완료된 유저(done)를 100% 원천 제외한 남아있는 순수 미당첨 유저만 필터링!
    const activeRemaining = runners.filter(u => u.id !== winner.id && !u.done);
    
    // 미당첨 남아있는 유저들을 무작위 셔플!
    const shuffledRemaining = [...activeRemaining].sort(() => Math.random() - 0.5);

    const prevRunner = shuffledRemaining[0] || null;
    const nextRunner = shuffledRemaining[1] || null;

    let prevCardHtml = prevRunner ? `
      <div class="picker-card-2d" style="opacity:0.35;transform:scale(0.92);margin-bottom:2px;">
        <img src="${prevRunner.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">${prevRunner.real_name || prevRunner.name}</span>
      </div>
    ` : '';

    let nextCardHtml = (nextRunner && nextRunner.id !== (prevRunner ? prevRunner.id : null)) ? `
      <div class="picker-card-2d" style="opacity:0.35;transform:scale(0.92);margin-top:2px;">
        <img src="${nextRunner.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">${nextRunner.real_name || nextRunner.name}</span>
      </div>
    ` : '';

    rouletteReelContainer.innerHTML = `
      ${prevCardHtml}
      <div class="picker-card-2d winner-highlight" style="transform:scale(1.04);z-index:10;box-shadow:0 4px 16px rgba(0,196,113,0.3);">
        <img src="${winner.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">🎉 ${winner.real_name || winner.name}</span>
      </div>
      ${nextCardHtml}
    `;
    rouletteReelContainer.style.transform = 'translateY(0px)';

    setTimeout(() => {
      if (onComplete) onComplete(winner);
    }, 700);
  },

  // 조 짜기 (팀 나누기) 쾌속 분배
  startGroupDealer(runners, teamCount, elements, onComplete) {
    if (this.isRolling) return;
    this.isRolling = true;

    const { groupBoxesGrid, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '👥 무작위 조 구성 중...';

    const shuffled = [...runners].sort(() => Math.random() - 0.5);
    const teams = Array.from({ length: teamCount }, () => []);

    shuffled.forEach((runner, idx) => {
      teams[idx % teamCount].push(runner);
    });

    groupBoxesGrid.innerHTML = teams.map((team, tIdx) => `
      <div class="group-team-box">
        <div class="team-title"><span>TEAM ${tIdx + 1}</span> <span>${team.length}명</span></div>
        <div class="team-members" style="display:flex;flex-wrap:wrap;gap:4px;">
          ${team.map(m => `<span class="group-member-pill">${m.real_name || m.name}</span>`).join('')}
        </div>
      </div>
    `).join('');

    const self = this;
    setTimeout(() => {
      self.isRolling = false;
      if (onComplete) onComplete('group', teams);
    }, 900);
  },

  stopAll() {
    this.isRolling = false;
    if (this.rollAnimTimer) cancelAnimationFrame(this.rollAnimTimer);
  }
};
