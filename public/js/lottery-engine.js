// Slack Pick Studio Roulette Engine (Smooth Deceleration & Continuous Spin)

const LotteryEngine = {
  isRolling: false,
  rollAnimTimer: null,
  CARD_HEIGHT: 54, // 카드 1개의 높이 (px)
  lastTargetY: 0,  // 이전 회전에서 멈춘 Y축 위치 (자연스러운 이어서 돌리기!)

  // 1명씩 룰렛 감속 스냅 추첨 (Smooth Deceleration & Snap)
  pickSingleWinner(runners, elements, onComplete) {
    // runners: 전체 유저 목록 (당첨자 포함!)
    if (this.isRolling || !runners || runners.length === 0) return;
    
    // 아직 당첨되지 않은 순수 남아있는 미당첨 유저만 필터링!
    const activeRunners = runners.filter(u => !u.done);
    if (activeRunners.length === 0) {
      alert('모든 유저가 당첨되었습니다! 🎉');
      return;
    }

    this.isRolling = true;
    const { rouletteReelContainer, raceCommentary, commentaryText } = elements;
    raceCommentary.classList.remove('hidden');
    commentaryText.textContent = '🎰 룰렛 돌리는 중... 틱틱틱!';

    // 1. 아직 미당첨된 유저 중 무작위 1명 당첨자 선정
    const winnerIndex = Math.floor(Math.random() * activeRunners.length);
    const winner = activeRunners[winnerIndex];

    // 2. 요구사항 1 & 3: 당첨자도 빼지 않고 회색 딤드로 포함하되, 같은 유저가 연속 2번 붙지 않는 꼬리물기 순환 릴 구축
    const REPEAT_COUNT = 14;
    let reelList = [];

    for (let r = 0; r < REPEAT_COUNT; r++) {
      const setRunners = [...runners].sort(() => Math.random() - 0.5);
      setRunners.forEach(u => {
        // 인접한 카드와 중복 시 순서 살짝 조정
        if (reelList.length > 0 && reelList[reelList.length - 1].id === u.id) {
          reelList.unshift(u);
        } else {
          reelList.push(u);
        }
      });
    }

    // Target 인덱스: 릴의 80% 지점에 위치한 당첨자 카드로 타깃팅
    const targetSetIndex = REPEAT_COUNT - 3;
    const targetIndex = (targetSetIndex * runners.length) + winnerIndex;
    
    // 타깃 위치에 당첨자 카드 강제 바인딩 (미당첨 상태)
    reelList[targetIndex] = { ...winner, done: false };

    // 슬롯 릴 HTML 바인딩 (당첨자는 이름 빼지 말고 회색 취소선 딤드 표기!)
    rouletteReelContainer.innerHTML = reelList.map((u, idx) => {
      const isTarget = (idx === targetIndex);
      const isDone = u.done && !isTarget; // 이미 당첨된 기존 유저는 회색 처리
      const displayName = getUserDisplayName(u);
      
      return `
        <div class="picker-card-2d ${isDone ? 'done-runner-card' : ''} ${isTarget ? 'target-winner-card' : ''}" data-index="${idx}">
          <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
          <span class="card-name">${isDone ? `<del style="color:#858a8d;">${displayName}</del>` : displayName}</span>
        </div>
      `;
    }).join('');

    // 🎯 요구사항 2: 이전 당첨자 위치(lastTargetY)에서부터 자연스럽게 다음 회전 시작!
    rouletteReelContainer.style.transition = 'none';
    rouletteReelContainer.style.transform = `translateY(${this.lastTargetY}px)`;

    // 타깃 오프셋 계산 (타깃 카드가 룰렛 창 160px 중앙 53px 지점에 오도록)
    const newTargetY = -(targetIndex * this.CARD_HEIGHT) + 53;
    this.lastTargetY = newTargetY; // 다음 회전을 위해 멈춤 위치 저장!

    // 강제 리플로우 후 감속 이어서 회전 적용 (chzzk-vote easeOut cubic-bezier)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        rouletteReelContainer.style.transition = 'transform 2.7s cubic-bezier(0.12, 0.82, 0.32, 1)';
        rouletteReelContainer.style.transform = `translateY(${newTargetY}px)`;
      });
    });

    const self = this;
    // 애니메이션 감속 완료 후 처리
    setTimeout(() => {
      self.finishSingleWinner(winner, targetIndex, elements, onComplete);
    }, 2800);
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
