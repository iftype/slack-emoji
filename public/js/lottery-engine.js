// Slack Meadow Lottery & Team Divider Engine

const LotteryEngine = {
  isRolling: false,
  rollAnimTimer: null,
  reelY: 0,

  // 롤러 추첨 애니메이션 실행
  startSlotLottery(runners, winCount, elements, onComplete) {
    if (this.isRolling) return;
    this.isRolling = true;

    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '🎯 무작위 롤러 돌아가는 중...';

    const shuffled = [...runners].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winCount);

    let reelCardsHtml = '';
    for (let i = 0; i < 8; i++) {
      runners.forEach(u => {
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
    let duration = 2500;
    const self = this;

    function rollLoop() {
      if (!self.isRolling) return;
      let elapsed = Date.now() - startTime;
      let progress = elapsed / duration;

      if (progress < 1) {
        let speed = Math.max(2, 30 * (1 - Math.pow(progress, 2)));
        self.reelY -= speed;
        if (Math.abs(self.reelY) > 1200) self.reelY = 0;
        rouletteReelContainer.style.transform = `translateY(${self.reelY}px)`;
        self.rollAnimTimer = requestAnimationFrame(rollLoop);
      } else {
        self.finishSlotLottery(winners, elements, onComplete);
      }
    }
    rollLoop();
  },

  finishSlotLottery(winners, elements, onComplete) {
    this.isRolling = false;
    if (this.rollAnimTimer) cancelAnimationFrame(this.rollAnimTimer);
    
    const { rouletteReelContainer, commentaryText } = elements;
    commentaryText.textContent = `🎉 축하합니다! ${winners.length}명의 당첨자 선정!`;

    rouletteReelContainer.innerHTML = winners.map(w => `
      <div class="picker-card-2d winner-highlight">
        <img src="${w.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">🎉 ${w.real_name || w.name}</span>
      </div>
    `).join('');
    rouletteReelContainer.style.transform = 'translateY(0px)';

    setTimeout(() => {
      if (onComplete) onComplete('podium', winners);
    }, 1200);
  },

  // 조 짜기 (팀 나누기) 실행 - 버튼 클릭 시에만 실행!
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
    }, 1200);
  },

  stopAll() {
    this.isRolling = false;
    if (this.rollAnimTimer) cancelAnimationFrame(this.rollAnimTimer);
  }
};
