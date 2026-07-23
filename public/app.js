// Slack Meadow Main App Controller

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');

  const mainScreen = document.getElementById('main-screen');
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

  const selectAllEmojis = document.getElementById('select-all-emojis');
  const selectAllRunnersBtn = document.getElementById('select-all-runners-btn');
  const deleteAllRunnersBtn = document.getElementById('delete-all-runners-btn');

  const configPodium = document.getElementById('config-podium');
  const configGroup = document.getElementById('config-group');
  const winnerCountInput = document.getElementById('winner-count-input');
  const teamCountInput = document.getElementById('team-count-input');
  const btnSummonChannelAll = document.getElementById('btn-summon-channel-all');

  const sliderWrapper = document.getElementById('slider-wrapper');
  const btnPrevSlide = document.getElementById('btn-prev-slide');

  // App State
  let currentAnalyzedMessage = null;
  let activeEmojiGroup = null;
  let currentFeedbacksData = [];
  let customEmojiCache = {};
  let currentUnreactedUsers = [];
  let pickedWinners = [];

  // Init Main Screen
  loadMainMeadow();

  async function loadMainMeadow() {
    mainScreen.classList.remove('hidden');
    loginScreen.classList.add('hidden');

    customEmojiCache = await SlackApi.fetchCustomEmojis();
    await refreshFeedbacks();
  }

  // 🎛️ 바텀시트 접기/펼치기 핸들 클릭 이벤트 (요구사항 6)
  bottomSheetHandle.addEventListener('click', () => {
    bottomSheet.classList.toggle('collapsed');
  });

  // 📋 클립보드 붙여넣기 헬퍼 (버튼 클릭 시만 수동 동작)
  const btnPasteClip = document.getElementById('btn-paste-clip');
  if (btnPasteClip) {
    btnPasteClip.addEventListener('click', checkClipboardAndAutoPaste);
  }

  async function checkClipboardAndAutoPaste() {
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
      alert('클립보드 접근 권한이 없거나 지원되지 않습니다. 직접 붙여넣기를 이용해주세요.');
    }
  }

  // 🌐 요구사항 4: 채널 인원 전체 소환 버튼 (무작위 추첨 오른쪽 위)
  btnSummonChannelAll.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !currentAnalyzedMessage.channel) {
      alert('슬랙 링크를 먼저 분석해주시거나 채널 정보가 필요합니다!');
      return;
    }
    // 미반응자 + 반응자 전체 병합 소환
    const allChannelUsers = [
      ...currentUnreactedUsers,
      ...(activeEmojiGroup ? activeEmojiGroup.users : [])
    ];
    if (allChannelUsers.length === 0) {
      alert('채널 인원을 불러올 수 없습니다.');
      return;
    }

    const updated = await SlackApi.saveFeedbackGroup(slackUrlInput.value.trim(), '', '🌐 채널 전체 인원', allChannelUsers);
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
    messageTime.textContent = msg.ts ? new Date(parseFloat(msg.ts) * 1000).toLocaleString('ko-KR') : '';
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

    selectAllEmojis.checked = false;
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

  // Tabs Toggle
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

  selectAllEmojis.addEventListener('change', (e) => {
    const isSelected = e.target.checked;
    const chips = emojiFilterChips.querySelectorAll('.emoji-chip');
    chips.forEach(chip => {
      if (isSelected) chip.classList.add('selected');
      else chip.classList.remove('selected');
    });

    if (isSelected && currentAnalyzedMessage && currentAnalyzedMessage.reactions) {
      const allUsersMap = new Map();
      currentAnalyzedMessage.reactions.forEach(r => {
        r.users.forEach(u => allUsersMap.set(u.id, u));
      });
      activeEmojiGroup = {
        name: '전체 선택',
        count: allUsersMap.size,
        users: Array.from(allUsersMap.values())
      };
      selectedEmojiDetail.classList.remove('hidden');
      detailEmojiBadge.textContent = '🌟';
      detailEmojiCount.textContent = `${allUsersMap.size}명 (모든 반응자)`;
      detailUserList.innerHTML = activeEmojiGroup.users.map(u => `
        <div class="user-chip" style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f7;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">
          <img src="${u.avatar || 'https://via.placeholder.com/20'}" style="width:18px;height:18px;border-radius:50%;">
          <span>${u.real_name || u.name}</span>
        </div>
      `).join('');
    }
  });

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

  async function refreshFeedbacks() {
    const feedbacks = await SlackApi.fetchFeedbacks();
    renderFeedbackList(feedbacks);
  }

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

  // 요구사항 5: 룰렛 명단 렌더링 시 :two: 대신 2️⃣ 유니코드 이모지 아이콘 사용
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
        <div class="feedback-group-item" style="background:#f5f5f7;border:1px solid rgba(0,0,0,0.06);border-radius:12px;padding:10px;margin-bottom:8px;">
          <div class="group-title" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;margin-bottom:6px;">
            <span>${emojiBadge} (${f.users.length}명)</span>
            <button class="btn-danger-xs" data-link="${f.messageLink}" data-emoji="${f.emoji}">삭제</button>
          </div>
          <div class="group-users" style="display:flex;flex-wrap:wrap;gap:4px;">
            ${f.users.map(u => `
              <span class="user-tag" style="font-size:11px;background:#ffffff;padding:2px 6px;border-radius:6px;border:1px solid rgba(0,0,0,0.05);">${u.real_name || u.name}</span>
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

  function renderRoulettePreview(runners) {
    rouletteReelContainer.innerHTML = '';
    if (!runners || runners.length === 0) {
      rouletteReelContainer.innerHTML = `
        <div class="picker-card-2d empty-card">
          <span class="card-avatar-text">🌱</span>
          <span class="card-name">명단을 소환해 보세요!</span>
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

  // 🔀 Game Mode Switch Event
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

  // 🎰 Start Lottery ONLY on explicit Button Click
  startRaceBtn.addEventListener('click', () => {
    runSingleLotterySpin();
  });

  function runSingleLotterySpin() {
    const runners = getUniqueActiveRunners();
    if (runners.length === 0) {
      alert('추첨 대상 유저가 없습니다!');
      return;
    }

    // 추첨 시작 시 바텀시트를 자동으로 슬림하게 접어 룰렛을 잘 보이게 처리 (요구사항 6)
    bottomSheet.classList.add('collapsed');

    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    const elements = {
      rouletteReelContainer,
      groupBoxesGrid,
      raceCommentary,
      commentaryText
    };

    if (mode === 'podium') {
      LotteryEngine.pickSingleWinner(runners, elements, (winner) => {
        if (winner) {
          pickedWinners.push(winner);
          currentFeedbacksData.forEach(f => {
            f.users.forEach(u => {
              if (u.id === winner.id) u.done = true;
            });
          });
          renderFeedbackList(currentFeedbacksData);
        }
        showFinalResultView('podium', pickedWinners);
      });
    } else {
      const teamCount = Math.min(parseInt(teamCountInput.value) || 2, runners.length);
      LotteryEngine.startGroupDealer(runners, teamCount, elements, (m, teams) => {
        showFinalResultView('group', teams);
      });
    }
  }

  btnSkipRace.addEventListener('click', () => {
    if (!LotteryEngine.isRolling) return;
    const runners = getUniqueActiveRunners();
    const elements = { rouletteReelContainer, groupBoxesGrid, raceCommentary, commentaryText };
    const winner = runners[Math.floor(Math.random() * runners.length)];
    if (winner) {
      pickedWinners.push(winner);
      currentFeedbacksData.forEach(f => {
        f.users.forEach(u => {
          if (u.id === winner.id) u.done = true;
        });
      });
      renderFeedbackList(currentFeedbacksData);
    }
    LotteryEngine.finishSingleWinner(winner, elements, () => {
      showFinalResultView('podium', pickedWinners);
    });
  });

  function showFinalResultView(mode, resultData) {
    raceCommentary.classList.add('hidden');
    bottomSheet.classList.remove('collapsed'); // 바텀시트 다시 펴짐
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

  // 요구사항 6: 결과 볼 때 확인 버튼 누르면 바텀시트 접힘
  rankingConfirmBtn.addEventListener('click', () => {
    sliderWrapper.style.transform = 'translateX(0%)';
    bottomSheet.classList.add('collapsed');
  });

  // 요구사항 2: 룰렛 다시돌릴 때 뒤로갔다 앞으로갔다 하지않고 즉시 회전!
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
      for (const f of currentFeedbacksData) {
        await SlackApi.deleteFeedbackGroup(f.messageLink, f.emoji);
      }
      refreshFeedbacks();
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
