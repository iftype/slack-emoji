// Slack Pick Studio Roulette Engine (Target-Centered Reel Precision Engine v28.0.0)

const LotteryEngine = {
  isRolling: false,
  CARD_HEIGHT: 54, // 카드 1개의 높이 (px)

  // 1명씩 룰렛 감속 스냅 추첨 (Smooth Deceleration & Snap)
  pickSingleWinner(rawRunners, elements, onComplete) {
    if (!rawRunners || rawRunners.length === 0) return;

    this.isRolling = false; // 락 강제 해제

    // 100% 유저 정규화
    const runners = rawRunners.map(u => {
      if (typeof u === 'string') return { id: u, name: u, real_name: u, display_name: u };
      return {
        id: u.id || u.name || ('usr_' + Math.random()),
        name: u.name || u.id || '사용자',
        real_name: u.real_name || u.name || '사용자',
        display_name: u.display_name || u.real_name || u.name || '사용자',
        avatar: u.avatar || '',
        done: !!u.done
      };
    });

    const activeRunners = runners.filter(u => !u.done);
    if (activeRunners.length === 0) {
      return;
    }

    this.isRolling = true;
    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    
    if (raceCommentary) raceCommentary.classList.remove('hidden');
    if (commentaryText) commentaryText.textContent = '🎰 룰렛 돌리는 중... 틱틱틱!';

    // 1. 아직 미당첨된 유저 중 무작위 1명 당첨자 선정
    const winnerIndex = Math.floor(Math.random() * activeRunners.length);
    const winner = activeRunners[winnerIndex];

    // 2. 꼬리물기 릴 명단 구축 (10 세트 반복)
    const REPEAT_COUNT = 12;
    let reelList = [];
    
    for (let r = 0; r < REPEAT_COUNT; r++) {
      const setRunners = [...runners].sort(() => Math.random() - 0.5);
      reelList.push(...setRunners);
    }

    while (reelList.length < 25) {
      runners.forEach(u => reelList.push(u));
    }

    // 타깃 인덱스: 릴의 15번째 카드 위치
    const targetIndex = Math.min(15, reelList.length - 4);
    reelList[targetIndex] = { ...winner, done: false };

    if (!rouletteReelContainer) return;

    // 슬롯 릴 HTML 바인딩
    rouletteReelContainer.innerHTML = reelList.map((u, idx) => {
      const isTarget = (idx === targetIndex);
      const isDone = u.done && !isTarget;
      const displayName = getUserDisplayName(u);
      
      return `
        <div class="picker-card-2d ${isDone ? 'done-runner-card' : ''} ${isTarget ? 'target-winner-card' : ''}" data-index="${idx}">
          <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
          <span class="card-name">${isDone ? `<del style="color:#858a8d;">${displayName}</del>` : displayName}</span>
        </div>
      `;
    }).join('');

    // 시작 포지션 (0px에서 출발)
    const targetY = -(targetIndex * this.CARD_HEIGHT);

    rouletteReelContainer.style.transition = 'none';
    rouletteReelContainer.style.transform = 'translateY(0px)';

    // 강제 리플로우 후 감속 회전 실행
    void rouletteReelContainer.offsetHeight;

    setTimeout(() => {
      rouletteReelContainer.style.transition = 'transform 2.2s cubic-bezier(0.12, 0.82, 0.32, 1)';
      rouletteReelContainer.style.transform = `translateY(${targetY}px)`;
    }, 40);

    const self = this;
    setTimeout(() => {
      self.finishSingleWinner(winner, targetIndex, elements, onComplete);
    }, 2400);
  },

  finishSingleWinner(winner, targetIndex, elements, onComplete) {
    this.isRolling = false;
    const winnerDisplayName = getUserDisplayName(winner);
    
    const { rouletteReelContainer, commentaryText } = elements;
    if (commentaryText) commentaryText.textContent = `🎉 [${winnerDisplayName}] 님 당첨!`;

    if (rouletteReelContainer) {
      const targetElement = rouletteReelContainer.querySelector(`[data-index="${targetIndex}"]`);
      if (targetElement) {
        targetElement.classList.remove('done-runner-card');
        targetElement.classList.add('winner-highlight');
        const nameEl = targetElement.querySelector('.card-name');
        if (nameEl && !nameEl.textContent.includes('🎉')) {
          nameEl.textContent = `🎉 ${winnerDisplayName}`;
        }
      }
    }

    setTimeout(() => {
      if (onComplete) onComplete(winner);
    }, 800);
  },

  // 조 짜기 (팀 나누기) 쾌속 분배
  startGroupDealer(rawRunners, teamCount, elements, onComplete) {
    this.isRolling = false;

    const runners = rawRunners.map(u => {
      if (typeof u === 'string') return { id: u, name: u, real_name: u, display_name: u };
      return u;
    });

    const { groupBoxesGrid, raceCommentary, commentaryText } = elements;
    if (raceCommentary) raceCommentary.classList.remove('hidden');
    if (commentaryText) commentaryText.textContent = '👥 무작위 조 구성 중...';

    const shuffled = [...runners].sort(() => Math.random() - 0.5);
    const teams = Array.from({ length: teamCount }, () => []);

    shuffled.forEach((runner, idx) => {
      teams[idx % teamCount].push(runner);
    });

    if (groupBoxesGrid) {
      groupBoxesGrid.innerHTML = teams.map((team, tIdx) => `
        <div class="group-team-box">
          <div class="team-title"><span>TEAM ${tIdx + 1}</span> <span>${team.length}명</span></div>
          <div class="team-members" style="display:flex;flex-wrap:wrap;gap:4px;">
            ${team.map(m => `<span class="group-member-pill">${getUserDisplayName(m)}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }

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
