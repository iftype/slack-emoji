// Slack Pick Studio Roulette Engine (Chzzk-Vote Deceleration & Cyclic Loop Style)

const LotteryEngine = {
  isRolling: false,
  rollAnimTimer: null,
  CARD_HEIGHT: 54, // 카드 1개의 높이 (px)

  // 1명씩 룰렛 감속 스냅 추첨 (Smooth Deceleration & Snap)
  pickSingleWinner(runners, elements, onComplete) {
    if (this.isRolling || !runners || runners.length === 0) return;
    this.isRolling = true;

    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '🎰 룰렛 돌리는 중... 틱틱틱!';

    // 1. 무작위 1명 당첨자 선정
    const winnerIndex = Math.floor(Math.random() * runners.length);
    const winner = runners[winnerIndex];

    // 2. 꼬리물기 릴 카드 배열 구축 (12 세트 반복)
    const REPEAT_COUNT = 12;
    let reelList = [];
    for (let r = 0; r < REPEAT_COUNT; r++) {
      // 각 세트마다 약간씩 무작위 셔플
      const setRunners = [...runners].sort(() => Math.random() - 0.5);
      reelList.push(...setRunners);
    }

    // Target 인덱스: 릴의 80% 지점에 위치한 당첨자 카드로 타깃팅
    const targetSetIndex = REPEAT_COUNT - 3;
    const targetIndex = (targetSetIndex * runners.length) + winnerIndex;
    
    // 당첨자 카드가 targetIndex에 올 수 있도록 배열 강제 보정
    reelList[targetIndex] = winner;

    // 슬롯 릴 HTML 바인딩
    rouletteReelContainer.innerHTML = reelList.map((u, idx) => {
      const isTarget = (idx === targetIndex);
      return `
        <div class="picker-card-2d ${isTarget ? 'target-winner-card' : ''}" data-index="${idx}">
          <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
          <span class="card-name">${u.real_name || u.name}</span>
        </div>
      `;
    }).join('');

    // 초기 위치 리셋
    rouletteReelContainer.style.transition = 'none';
    rouletteReelContainer.style.transform = 'translateY(0px)';

    // 타깃 오프셋 계산 (타깃 카드가 룰렛 창 160px 중앙 53px 지점에 오도록)
    // 룰렛 창 높이 160px, 카드 높이 약 54px -> (160 - 54)/2 = 53px 오프셋
    const targetY = -(targetIndex * this.CARD_HEIGHT) + 53;

    // 강제 리플로우 후 감속 애니메이션 적용 (chzzk-vote easeOut cubic-bezier)
    requestAnimationFrame(() => {
      rouletteReelContainer.style.transition = 'transform 2.6s cubic-bezier(0.15, 0.85, 0.35, 1)';
      rouletteReelContainer.style.transform = `translateY(${targetY}px)`;
    });

    const self = this;
    // 애니메이션 감속 완료 후 처리
    setTimeout(() => {
      self.finishSingleWinner(winner, targetIndex, elements, onComplete);
    }, 2700);
  },

  finishSingleWinner(winner, targetIndex, elements, onComplete) {
    this.isRolling = false;
    
    const { rouletteReelContainer, commentaryText } = elements;
    commentaryText.textContent = `🎉 [${winner.real_name || winner.name}] 님 당첨!`;

    // 🎯 멈춘 위치의 타깃 카드를 highlight 효과로 밝게 표시!
    const targetElement = rouletteReelContainer.querySelector(`[data-index="${targetIndex}"]`);
    if (targetElement) {
      targetElement.classList.add('winner-highlight');
      const nameEl = targetElement.querySelector('.card-name');
      if (nameEl && !nameEl.textContent.includes('🎉')) {
        nameEl.textContent = `🎉 ${winner.real_name || winner.name}`;
      }
    }

    setTimeout(() => {
      if (onComplete) onComplete(winner);
    }, 500);
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
  }
};
