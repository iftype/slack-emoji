// Slack Pick Studio Roulette Engine (Fixed Stationary Reel & Strict Separation)

const LotteryEngine = {
  isRolling: false,
  CARD_HEIGHT: 54, // 카드 1개의 높이 (px)
  lastTargetY: 0,  // 이전 회전에서 멈춘 Y축 위치

  // 1명씩 룰렛 감속 스냅 추첨 (Smooth Deceleration & Snap)
  pickSingleWinner(runners, elements, onComplete) {
    if (!runners || runners.length === 0) return;

    // 강제 락 방지 (3.5초 안전 타이머)
    if (this.isRolling) {
      console.warn('Roulette is already rolling, forcing state reset for next spin.');
      this.isRolling = false;
    }
    
    // 아직 당첨되지 않은 순수 남아있는 미당첨 유저만 필터링!
    const activeRunners = runners.filter(u => !u.done);
    if (activeRunners.length === 0) {
      alert('추첨할 남은 유저가 없습니다! 🎉');
      return;
    }

    this.isRolling = true;
    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '🎰 룰렛 돌리는 중... 틱틱틱!';

    // 1. 아직 미당첨된 유저 중 무작위 1명 당첨자 선정
    const winnerIndex = Math.floor(Math.random() * activeRunners.length);
    const winner = activeRunners[winnerIndex];

    // 2. 동일 이름이 화면(3카드 노출) 내에 2번 겹쳐 보이지 않도록 엄격한 간격 유지 릴 조립
    const REPEAT_COUNT = 15;
    let reelList = [];
    
    // 셔플된 단일 명단 기반으로 순환 배치
    const baseCycle = [...runners].sort(() => Math.random() - 0.5);

    for (let r = 0; r < REPEAT_COUNT; r++) {
      baseCycle.forEach(u => {
        // 최근 3개 카드 안에 동일한 ID가 등장하면 건너뜀 (중복 노출 방지!)
        const recent3 = reelList.slice(-3);
        if (!recent3.some(item => item.id === u.id)) {
          reelList.push(u);
        }
      });
    }

    // 명단 수가 적어 reelList가 부족할 경우 최소한의 기본 순환 채우기
    while (reelList.length < 30) {
      runners.forEach(u => reelList.push(u));
    }

    // Target 인덱스: 릴의 80% 지점에 위치한 당첨자 카드로 타깃팅
    const targetSetIndex = Math.floor(reelList.length * 0.75);
    const targetIndex = targetSetIndex;
    
    // 타깃 위치에 당첨자 카드 강제 바인딩 (미당첨 상태)
    reelList[targetIndex] = { ...winner, done: false };

    // 슬롯 릴 HTML 바인딩 (당첨자는 이름 빼지 말고 회색 취소선 딤드 표기!)
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

    // 이전 당첨자 위치(lastTargetY)에서부터 자연스럽게 다음 회전 시작!
    rouletteReelContainer.style.transition = 'none';
    rouletteReelContainer.style.transform = `translateY(${this.lastTargetY}px)`;

    // 타깃 오프셋 계산 (타깃 카드가 룰렛 창 160px 중앙 53px 지점에 오도록)
    const newTargetY = -(targetIndex * this.CARD_HEIGHT) + 53;
    this.lastTargetY = newTargetY;

    // 강제 리플로우 후 감속 회전 적용
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rouletteReelContainer.style.transition = 'transform 2.6s cubic-bezier(0.12, 0.82, 0.32, 1)';
        rouletteReelContainer.style.transform = `translateY(${newTargetY}px)`;
      });
    });

    const self = this;
    // 안전 타임아웃
    setTimeout(() => {
      self.finishSingleWinner(winner, targetIndex, elements, onComplete);
    }, 2700);
  },

  finishSingleWinner(winner, targetIndex, elements, onComplete) {
    this.isRolling = false;
    const winnerDisplayName = getUserDisplayName(winner);
    
    const { rouletteReelContainer, commentaryText } = elements;
    commentaryText.textContent = `🎉 [${winnerDisplayName}] 님 당첨!`;

    // 🎯 멈춘 위치의 타깃 카드를 highlight 효과로 밝게 표시!
    const targetElement = rouletteReelContainer.querySelector(`[data-index="${targetIndex}"]`);
    if (targetElement) {
      targetElement.classList.remove('done-runner-card');
      targetElement.classList.add('winner-highlight');
      const nameEl = targetElement.querySelector('.card-name');
      if (nameEl && !nameEl.textContent.includes('🎉')) {
        nameEl.textContent = `🎉 ${winnerDisplayName}`;
      }
    }

    setTimeout(() => {
      if (onComplete) onComplete(winner);
    }, 500);
  },

  // 조 짜기 (팀 나누기) 쾌속 분배
  startGroupDealer(runners, teamCount, elements, onComplete) {
    this.isRolling = false;

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
          ${team.map(m => `<span class="group-member-pill">${getUserDisplayName(m)}</span>`).join('')}
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
