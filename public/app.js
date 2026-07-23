// Slack Meadow Main App Controller

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const mainScreen = document.querySelector('.meadow-canvas-full');
  const analyzerForm = document.getElementById('analyzer-form');
  const slackUrlInput = document.getElementById('slack-url');
  const submitBtn = document.getElementById('submit-btn');
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');

  const resultSection = document.getElementById('result-section');
  const messageAvatar = document.getElementById('message-avatar');
  const messageAuthor = document.getElementById('message-author');
  const messageTime = document.getElementById('message-time');
  const messageText = document.getElementById('message-text');

  // Tabs
  const tabBtnEmojis = document.getElementById('tab-btn-emojis');
  const tabBtnUnreacted = document.getElementById('tab-btn-unreacted');
  const tabContentEmojis = document.getElementById('tab-content-emojis');
  const tabContentUnreacted = document.getElementById('tab-content-unreacted');
  const unreactedCountBadge = document.getElementById('unreacted-count-badge');
  const unreactedUserList = document.getElementById('unreacted-user-list');
  const btnCopyUnreacted = document.getElementById('btn-copy-unreacted');
  const btnSummonUnreacted = document.getElementById('btn-summon-unreacted');

  const emojiFilterChips = document.getElementById('emoji-filter-chips');
  const selectedEmojiDetail = document.getElementById('selected-emoji-detail');
  const detailEmojiBadge = document.getElementById('detail-emoji-badge');
  const detailEmojiCount = document.getElementById('detail-emoji-count');
  const detailUserList = document.getElementById('detail-user-list');
  const addToFeedbackBtn = document.getElementById('add-to-feedback-btn');

  const btnToggleUserAnalysis = document.getElementById('btn-toggle-user-analysis');
  const userAnalysisPanel = document.getElementById('user-analysis-panel');
  const analysisTotalCount = document.getElementById('analysis-total-count');
  const btnCopySpacedNames = document.getElementById('btn-copy-spaced-names');
  const analysisUserList = document.getElementById('analysis-user-list');

  const bottomSheet = document.getElementById('bottom-sheet');
  const bottomSheetHandle = document.getElementById('bottom-sheet-handle');
  const rouletteStage = document.getElementById('roulette-stage');
  const rouletteReelContainer = document.getElementById('roulette-reel-container');
  const groupDealerStage = document.getElementById('group-dealer-stage');
  const groupBoxesGrid = document.getElementById('group-boxes-grid');

  const startRaceBtn = document.getElementById('start-race-btn');
  const raceCommentary = document.getElementById('race-commentary');
  const commentaryText = document.getElementById('commentary-text');
  const btnSkipRace = document.getElementById('btn-skip-race');

  const rankingListView = document.getElementById('ranking-list-view');
  const groupRankingView = document.getElementById('group-ranking-view');
  const rankingConfirmBtn = document.getElementById('ranking-confirm-btn');
  const rankingRetryBtn = document.getElementById('ranking-retry-btn');
  const btnCopyResultFormatted = document.getElementById('btn-copy-result-formatted');

  const selectAllEmojis = document.getElementById('select-all-emojis');
  const selectAllRunnersBtn = document.getElementById('select-all-runners-btn');
  const deleteAllRunnersBtn = document.getElementById('delete-all-runners-btn');

  const configPodium = document.getElementById('config-podium');
  const configGroup = document.getElementById('config-group');
  const winnerCountInput = document.getElementById('winner-count-input');
  const teamCountInput = document.getElementById('team-count-input');
  const btnSummonChannelAll = document.getElementById('btn-summon-channel-all');
  const btnPasteClip = document.getElementById('btn-paste-clip');

  const sliderWrapper = document.getElementById('slider-wrapper');
  const btnPrevSlide = document.getElementById('btn-prev-slide');

  // App State
  let currentAnalyzedMessage = null;
  let activeEmojiGroup = null;
  let currentFeedbacksData = [];
  let customEmojiCache = {};
  let currentUnreactedUsers = [];
  let pickedWinners = [];
  let lastGroupResult = null;

  // Init Main Screen
  loadMainMeadow();

  async function loadMainMeadow() {
    customEmojiCache = await SlackApi.fetchCustomEmojis();
    renderFeedbackList([]);
    renderRoulettePreview([]);
  }

  // ➕/➖ Stepper 수량 증감 버튼 이벤트 (요구사항 1)
  const btnWinnerMinus = document.getElementById('btn-winner-minus');
  const btnWinnerPlus = document.getElementById('btn-winner-plus');
  const btnTeamMinus = document.getElementById('btn-team-minus');
  const btnTeamPlus = document.getElementById('btn-team-plus');

  if (btnWinnerMinus && btnWinnerPlus) {
    btnWinnerMinus.addEventListener('click', () => {
      const val = Math.max(1, (parseInt(winnerCountInput.value) || 1) - 1);
      winnerCountInput.value = val;
    });
    btnWinnerPlus.addEventListener('click', () => {
      const val = Math.min(50, (parseInt(winnerCountInput.value) || 1) + 1);
      winnerCountInput.value = val;
    });
  }

  if (btnTeamMinus && btnTeamPlus) {
    btnTeamMinus.addEventListener('click', () => {
      const val = Math.max(2, (parseInt(teamCountInput.value) || 2) - 1);
      teamCountInput.value = val;
    });
    btnTeamPlus.addEventListener('click', () => {
      const val = Math.min(10, (parseInt(teamCountInput.value) || 2) + 1);
      teamCountInput.value = val;
    });
  }

  // 🎛️ 바텀시트 접기/펼치기 핸들 클릭
  bottomSheetHandle.addEventListener('click', () => {
    bottomSheet.classList.toggle('collapsed');
  });

  // 📋 수동 클립보드 붙여넣기 버튼 클릭 (자동 붙여넣기 100% 제거)
  if (btnPasteClip) {
    btnPasteClip.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text && text.includes('slack.com/archives/')) {
            const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
            if (match) {
              slackUrlInput.value = match[0];
            }
          }
        }
      } catch (e) {
        alert('클립보드 접근 권한이 없습니다. 직접 붙여넣어주세요.');
      }
    });
  }

  // 🌐 채널 인원 전체 소환 버튼 (유저 ID 기준 중복 100% 완전 제거!)
  btnSummonChannelAll.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !currentAnalyzedMessage.channel) {
      alert('슬랙 링크를 먼저 분석해주시거나 채널 정보가 필요합니다!');
      return;
    }
    
    // 🚨 UNIQUE Map으로 유저 ID 중복 원천 차단!
    const uniqueUserMap = new Map();
    
    (currentUnreactedUsers || []).forEach(u => uniqueUserMap.set(u.id, u));
    
    if (currentAnalyzedMessage.reactions) {
      currentAnalyzedMessage.reactions.forEach(r => {
        r.users.forEach(u => uniqueUserMap.set(u.id, u));
      });
    }

    const uniqueChannelUsers = Array.from(uniqueUserMap.values());
    if (uniqueChannelUsers.length === 0) {
      alert('채널 인원을 불러올 수 없습니다.');
      return;
    }

    const updated = await SlackApi.saveFeedbackGroup(
      slackUrlInput.value.trim(), 
      '', 
      `🌐 채널 전체 (${uniqueChannelUsers.length}명)`, 
      uniqueChannelUsers
    );
    renderFeedbackList(updated);
    sliderWrapper.style.transform = 'translateX(-33.333%)';
    bottomSheet.classList.remove('collapsed');
  });

  // 🔍 Analyze Slack URL
  analyzerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = slackUrlInput.value.trim();
    setLoading(true);
    statusContainer.classList.add('hidden');

    try {
      const messageData = await SlackApi.analyzeSlackUrl(url);
      currentAnalyzedMessage = messageData;
      renderAnalysisResult(messageData);
      resultSection.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  function renderAnalysisResult(msg) {
    messageAvatar.src = msg.user.avatar || 'https://via.placeholder.com/40';
    messageAuthor.textContent = msg.user.real_name || msg.user.name;

    if (msg.ts) {
      const dateObj = new Date(parseFloat(msg.ts) * 1000);
      const hours = dateObj.getHours();
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? '오후' : '오전';
      const formattedHour = hours % 12 || 12;
      messageTime.textContent = `${ampm} ${formattedHour}:${minutes}`;
    } else {
      messageTime.textContent = '';
    }

    messageText.innerHTML = parseTextEmojis(msg.text, customEmojiCache);

    currentUnreactedUsers = msg.unreactedUsers || [];
    unreactedCountBadge.textContent = currentUnreactedUsers.length;
    renderUnreactedList(currentUnreactedUsers);

    emojiFilterChips.innerHTML = '';
    const reactions = msg.reactions || [];

    reactions.forEach(r => {
      const chip = document.createElement('div');
      chip.className = 'emoji-chip';
      chip.dataset.emojiName = r.name;
      chip.innerHTML = `<span class="chip-icon">${renderEmojiIcon(r.name, customEmojiCache)}</span> <span class="chip-count">${r.count}</span>`;

      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
        updateSelectedEmojiDetail(r);
      });
      emojiFilterChips.appendChild(chip);
    });

    if (selectAllEmojis) selectAllEmojis.checked = false;
    renderUserAnalysisPanel(reactions);
  }

  function renderUnreactedList(users) {
    unreactedUserList.innerHTML = '';
    if (!users || users.length === 0) {
      unreactedUserList.innerHTML = '<p class="empty-text">해당 채널의 모든 유저가 이모지를 달았습니다! 🎉</p>';
      return;
    }

    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'unreacted-user-item';
      item.innerHTML = `
        <img src="${u.avatar || 'https://via.placeholder.com/22'}" alt="${u.real_name}">
        <span>${u.real_name || u.name}</span>
      `;
      unreactedUserList.appendChild(item);
    });
  }

  tabBtnEmojis.addEventListener('click', () => {
    tabBtnEmojis.classList.add('active');
    tabBtnUnreacted.classList.remove('active');
    tabContentEmojis.classList.remove('hidden');
    tabContentUnreacted.classList.add('hidden');
  });

  tabBtnUnreacted.addEventListener('click', () => {
    tabBtnUnreacted.classList.add('active');
    tabBtnEmojis.classList.remove('active');
    tabContentUnreacted.classList.remove('hidden');
    tabContentEmojis.classList.add('hidden');
  });

  btnCopyUnreacted.addEventListener('click', () => {
    if (currentUnreactedUsers.length === 0) return;
    const names = currentUnreactedUsers.map(u => u.real_name || u.name).join(' ');
    navigator.clipboard.writeText(names);
    alert(`미반응자 ${currentUnreactedUsers.length}명의 이름이 복사되었습니다!`);
  });

  btnSummonUnreacted.addEventListener('click', async () => {
    if (currentUnreactedUsers.length === 0) return;
    const updated = await SlackApi.saveFeedbackGroup(slackUrlInput.value.trim(), '', '🚨 이모지 미반응자', currentUnreactedUsers);
    renderFeedbackList(updated);
    sliderWrapper.style.transform = 'translateX(-33.333%)';
  });

  function updateSelectedEmojiDetail(reactionData) {
    activeEmojiGroup = reactionData;
    selectedEmojiDetail.classList.remove('hidden');
    detailEmojiBadge.innerHTML = renderEmojiIcon(reactionData.name, customEmojiCache);
    detailEmojiCount.textContent = `${reactionData.users.length}명`;

    detailUserList.innerHTML = reactionData.users.map(u => `
      <div class="user-chip" style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f7;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">
        <img src="${u.avatar || 'https://via.placeholder.com/20'}" style="width:18px;height:18px;border-radius:50%;">
        <span>${u.real_name || u.name}</span>
      </div>
    `).join('');
  }

  addToFeedbackBtn.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !activeEmojiGroup) return;
    const updated = await SlackApi.saveFeedbackGroup(
      slackUrlInput.value.trim(),
      currentAnalyzedMessage.text,
      activeEmojiGroup.name,
      activeEmojiGroup.users
    );
    renderFeedbackList(updated);
    sliderWrapper.style.transform = 'translateX(-33.333%)';
  });

  // 🚨 이미 당첨되어 선출된 유저(u.done === true)를 100% 완전 제외한 유니크 활성 명단 반환!
  function getUniqueActiveRunners() {
    const runnerMap = new Map();
    currentFeedbacksData.forEach(f => {
      f.users.forEach(u => {
        if (!u.done && !runnerMap.has(u.id)) {
          runnerMap.set(u.id, u);
        }
      });
    });
    return Array.from(runnerMap.values());
  }

  function renderFeedbackList(feedbacks) {
    currentFeedbacksData = feedbacks || [];
    if (currentFeedbacksData.length === 0) {
      document.getElementById('feedback-list-container').innerHTML = '<p class="empty-text">소환된 유저가 없습니다. 슬랙 메시지를 분석해 소환해보세요!</p>';
      startRaceBtn.classList.add('hidden');
      renderRoulettePreview([]);
      return;
    }

    startRaceBtn.classList.remove('hidden');
    const uniqueRunners = getUniqueActiveRunners();
    renderRoulettePreview(uniqueRunners);

    let html = '';
    currentFeedbacksData.forEach(f => {
      const emojiBadge = renderEmojiIcon(f.emoji, customEmojiCache);
      html += `
        <div class="feedback-group-item" style="background:#f8f9fa;border:1px solid #e4e5e7;border-radius:10px;padding:10px;margin-bottom:8px;">
          <div class="group-title" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;margin-bottom:6px;">
            <span>${emojiBadge} (${f.users.length}명)</span>
            <button class="btn-danger-xs" data-link="${f.messageLink}" data-emoji="${f.emoji}">삭제</button>
          </div>
          <div class="group-users" style="display:flex;flex-wrap:wrap;gap:4px;">
            ${f.users.map(u => `
              <span class="user-tag" style="font-size:11px;background:#ffffff;padding:2px 6px;border-radius:6px;border:1px solid #e4e5e7;${u.done ? 'text-decoration:line-through;opacity:0.5;' : ''}">${u.real_name || u.name}</span>
            `).join('')}
          </div>
        </div>
      `;
    });
    const container = document.getElementById('feedback-list-container');
    container.innerHTML = html;

    container.querySelectorAll('.btn-danger-xs').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const link = e.target.dataset.link;
        const emoji = e.target.dataset.emoji;
        const updated = await SlackApi.deleteFeedbackGroup(link, emoji);
        renderFeedbackList(updated);
      });
    });
  }

  // 🚨 남아있는 순수 미당첨 유저(runners)로만 룰렛 카드 릴을 즉시 깨끗하게 갱신!
  function renderRoulettePreview(runners) {
    rouletteReelContainer.innerHTML = '';
    if (!runners || runners.length === 0) {
      rouletteReelContainer.innerHTML = `
        <div class="picker-card-2d empty-card">
          <span class="card-avatar-text">🌱</span>
          <span class="card-name">추첨이 완료되었습니다!</span>
        </div>
      `;
      return;
    }

    runners.forEach(u => {
      const card = document.createElement('div');
      card.className = 'picker-card-2d';
      card.innerHTML = `
        <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">${u.real_name || u.name}</span>
      `;
      rouletteReelContainer.appendChild(card);
    });
  }

  const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
  gameModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'group') {
        configPodium.classList.add('hidden');
        configGroup.classList.remove('hidden');
        rouletteStage.classList.add('hidden');
        groupDealerStage.classList.remove('hidden');
        startRaceBtn.textContent = '🎴 팀 나누기!';
      } else {
        configGroup.classList.add('hidden');
        configPodium.classList.remove('hidden');
        groupDealerStage.classList.add('hidden');
        rouletteStage.classList.remove('hidden');
        startRaceBtn.textContent = '🎰 추첨 시작!';
      }
    });
  });

  startRaceBtn.addEventListener('click', () => {
    runSingleLotterySpin();
  });

  function runSingleLotterySpin() {
    const runners = getUniqueActiveRunners(); // 🚨 아직 안 뽑힌 순수 남아있는 유저만 반환!
    if (runners.length === 0) {
      alert('추첨 대상 유저가 없습니다!');
      return;
    }

    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    const elements = { rouletteReelContainer, groupBoxesGrid, raceCommentary, commentaryText };

    if (mode === 'podium') {
      LotteryEngine.pickSingleWinner(runners, elements, (winner) => {
        if (winner) {
          pickedWinners.push(winner);
          // 🚨 당첨된 유저를 done = true 로 확고히 기록하여 다음 룰렛 릴에서 100% 원천 제거!
          currentFeedbacksData.forEach(f => {
            f.users.forEach(u => {
              if (u.id === winner.id) u.done = true;
            });
          });
          renderFeedbackList(currentFeedbacksData);
        }
        // 🚨 룰렛 릴 카드 렌더링을 남아있는 인원으로 즉시 깨끗하게 갱신!
        renderRoulettePreview(getUniqueActiveRunners());
        showFinalResultView('podium', pickedWinners);
      });
    } else {
      const teamCount = Math.min(parseInt(teamCountInput.value) || 2, runners.length);
      LotteryEngine.startGroupDealer(runners, teamCount, elements, (m, teams) => {
        lastGroupResult = teams;
        showFinalResultView('group', teams);
      });
    }
  }

  function showFinalResultView(mode, resultData) {
    raceCommentary.classList.add('hidden');
    bottomSheet.classList.remove('collapsed');
    sliderWrapper.style.transform = 'translateX(-66.666%)';

    if (mode === 'podium') {
      rankingListView.classList.remove('hidden');
      groupRankingView.classList.add('hidden');
      const remainingCount = getUniqueActiveRunners().length;
      rankingRetryBtn.querySelector('.btn-text').textContent = remainingCount > 0 
        ? `🎰 다음 당첨자 뽑기 (남은 ${remainingCount}명)` 
        : '🎉 추첨 완료';

      rankingRetryBtn.disabled = (remainingCount === 0);

      rankingListView.innerHTML = resultData.map((w, idx) => `
        <div class="winner-result-card">
          <span class="winner-rank-badge">${idx + 1}등</span>
          <img src="${w.avatar || 'https://via.placeholder.com/44'}" class="winner-avatar">
          <div class="winner-info">
            <div class="name">${w.real_name || w.name}</div>
            <div style="font-size:12px;color:#64748b;">🎉 축하합니다! (자동 중복제외 적용)</div>
          </div>
        </div>
      `).join('');
    } else {
      groupRankingView.classList.remove('hidden');
      rankingListView.classList.add('hidden');
      rankingRetryBtn.querySelector('.btn-text').textContent = '다시 조 짜기';
      rankingRetryBtn.disabled = false;

      groupRankingView.innerHTML = resultData.map((team, tIdx) => `
        <div class="panel-card" style="text-align:left;margin-bottom:8px;">
          <h4 style="color:var(--primary);margin-bottom:6px;">TEAM ${tIdx + 1} (${team.length}명)</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${team.map(m => `<span class="group-member-pill">${m.real_name || m.name}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  // 📋 팀 구성 명단 복사 핸들러 (• 1팀: 찰리, 클라우디...)
  btnCopyResultFormatted.addEventListener('click', () => {
    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    if (mode === 'group' && lastGroupResult) {
      const lines = lastGroupResult.map((team, idx) => {
        const names = team.map(m => m.real_name || m.name).join(', ');
        return `• ${idx + 1}팀: ${names}`;
      });
      const copyText = lines.join('\n');
      navigator.clipboard.writeText(copyText);
      alert('팀 구성 명단이 클립보드에 복사되었습니다!\n\n' + copyText);
    } else if (pickedWinners.length > 0) {
      const copyText = pickedWinners.map((w, idx) => `${idx + 1}등: ${w.real_name || w.name}`).join('\n');
      navigator.clipboard.writeText(copyText);
      alert('당첨자 명단이 클립보드에 복사되었습니다!');
    }
  });

  rankingConfirmBtn.addEventListener('click', () => {
    pickedWinners = [];
    sliderWrapper.style.transform = 'translateX(0%)';
    bottomSheet.classList.add('collapsed');
    renderRoulettePreview(getUniqueActiveRunners());
  });

  rankingRetryBtn.addEventListener('click', () => {
    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    if (mode === 'podium') {
      const remainingRunners = getUniqueActiveRunners();
      if (remainingRunners.length > 0) {
        runSingleLotterySpin();
      }
    } else {
      const runners = getUniqueActiveRunners();
      const teamCount = Math.min(parseInt(teamCountInput.value) || 2, runners.length);
      const elements = { rouletteReelContainer, groupBoxesGrid, raceCommentary, commentaryText };
      LotteryEngine.startGroupDealer(runners, teamCount, elements, (m, teams) => {
        lastGroupResult = teams;
        showFinalResultView('group', teams);
      });
    }
  });

  btnPrevSlide.addEventListener('click', () => {
    sliderWrapper.style.transform = 'translateX(0%)';
  });

  deleteAllRunnersBtn.addEventListener('click', async () => {
    if (confirm('소환된 명단을 모두 삭제하시겠습니까?')) {
      pickedWinners = [];
      for (const f of [...currentFeedbacksData]) {
        await SlackApi.deleteFeedbackGroup(f.messageLink, f.emoji);
      }
      currentFeedbacksData = [];
      renderFeedbackList([]);
      renderRoulettePreview([]);
      alert('추첨 명단이 완전히 삭제되었습니다.');
    }
  });

  function setLoading(loading) {
    if (loading) {
      submitBtn.querySelector('.spinner').classList.remove('hidden');
      submitBtn.querySelector('.btn-text').textContent = '분석 중...';
      submitBtn.disabled = true;
    } else {
      submitBtn.querySelector('.spinner').classList.add('hidden');
      submitBtn.querySelector('.btn-text').textContent = '이모지 가져오기';
      submitBtn.disabled = false;
    }
  }

  function showError(msg) {
    statusContainer.classList.remove('hidden');
    statusMessage.textContent = msg;
  }

  function renderUserAnalysisPanel(reactions) {
    const userMap = new Map();
    reactions.forEach(r => {
      r.users.forEach(u => {
        if (!userMap.has(u.id)) {
          userMap.set(u.id, { user: u, emojis: [] });
        }
        userMap.get(u.id).emojis.push(r.name);
      });
    });

    analysisTotalCount.textContent = `총 ${userMap.size}명`;
    analysisUserList.innerHTML = Array.from(userMap.values()).map(item => `
      <div class="user-analysis-item" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
        <span style="font-size:12px;font-weight:600;">${item.user.real_name || item.user.name}</span>
        <span>${item.emojis.map(e => renderEmojiIcon(e, customEmojiCache)).join(' ')}</span>
      </div>
    `).join('');
  }

  btnToggleUserAnalysis.addEventListener('click', () => {
    userAnalysisPanel.classList.toggle('hidden');
  });

  btnCopySpacedNames.addEventListener('click', () => {
    const runners = getUniqueActiveRunners();
    if (runners.length === 0) return;
    const names = runners.map(u => u.real_name || u.name).join(' ');
    navigator.clipboard.writeText(names);
    alert(`명단 ${runners.length}명의 이름이 복사되었습니다!`);
  });
});
