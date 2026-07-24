// Slack Meadow Main App Controller (Null-Safe Hardened Version v19.0.0)

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Safe Helper
  const getEl = (id) => document.getElementById(id);

  // DOM Elements
  const mainScreen = document.querySelector('.meadow-canvas-full');
  const analyzerForm = getEl('analyzer-form');
  const slackUrlInput = getEl('slack-url');
  const submitBtn = getEl('submit-btn');
  const statusContainer = getEl('status-container');
  const statusMessage = getEl('status-message');

  const resultSection = getEl('result-section');
  const messageAvatar = getEl('message-avatar');
  const messageAuthor = getEl('message-author');
  const messageTime = getEl('message-time');
  const messageText = getEl('message-text');

  // Tabs
  const tabBtnEmojis = getEl('tab-btn-emojis');
  const tabBtnUnreacted = getEl('tab-btn-unreacted');
  const tabContentEmojis = getEl('tab-content-emojis');
  const tabContentUnreacted = getEl('tab-content-unreacted');
  const unreactedCountBadge = getEl('unreacted-count-badge');
  const unreactedUserList = getEl('unreacted-user-list');
  const btnCopyUnreacted = getEl('btn-copy-unreacted');
  const btnSummonUnreacted = getEl('btn-summon-unreacted');

  const emojiFilterChips = getEl('emoji-filter-chips');
  const selectedEmojiDetail = getEl('selected-emoji-detail');
  const detailEmojiBadge = getEl('detail-emoji-badge');
  const detailEmojiCount = getEl('detail-emoji-count');
  const detailUserList = getEl('detail-user-list');
  const addToFeedbackBtn = getEl('add-to-feedback-btn');

  const btnToggleUserAnalysis = getEl('btn-toggle-user-analysis');
  const userAnalysisPanel = getEl('user-analysis-panel');
  const analysisTotalCount = getEl('analysis-total-count');
  const btnCopySpacedNames = getEl('btn-copy-spaced-names');
  const analysisUserList = getEl('analysis-user-list');

  const bottomSheet = getEl('bottom-sheet');
  const bottomSheetHandle = getEl('bottom-sheet-handle');
  const rouletteStage = getEl('roulette-stage');
  const rouletteReelContainer = getEl('roulette-reel-container');
  const groupDealerStage = getEl('group-dealer-stage');
  const groupBoxesGrid = getEl('group-boxes-grid');

  const startRaceBtn = getEl('start-race-btn');
  const raceCommentary = getEl('race-commentary');
  const commentaryText = getEl('commentary-text');
  const btnSkipRace = getEl('btn-skip-race');

  const rankingListView = getEl('ranking-list-view');
  const groupRankingView = getEl('group-ranking-view');
  const rankingConfirmBtn = getEl('ranking-confirm-btn');
  const rankingRetryBtn = getEl('ranking-retry-btn');
  const btnCopyResultFormatted = getEl('btn-copy-result-formatted');

  const selectAllEmojis = getEl('select-all-emojis');
  const selectAllRunnersBtn = getEl('select-all-runners-btn');
  const deleteAllRunnersBtn = getEl('delete-all-runners-btn');

  const configPodium = getEl('config-podium');
  const configGroup = getEl('config-group');
  const winnerCountInput = getEl('winner-count-input');
  const teamCountInput = getEl('team-count-input');
  const btnSummonChannelAll = getEl('btn-summon-channel-all');
  const btnPasteClip = getEl('btn-paste-clip');

  const sliderWrapper = getEl('slider-wrapper');
  const btnPrevSlide = getEl('btn-prev-slide');

  // App State
  let currentAnalyzedMessage = null;
  let activeEmojiGroup = null;
  let currentFeedbacksData = [];
  let customEmojiCache = {};
  let currentUnreactedUsers = [];
  let pickedWinners = [];
  let lastGroupResult = null;

  // 🎲 100% 무작위 셔플 헬퍼
  function shuffleArray(arr) {
    if (!arr || !Array.isArray(arr)) return [];
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 🚨 [핵심 헬퍼 함수 최상단 배치 - Null Safe]
  function getAllRunners() {
    const runnerMap = new Map();
    (currentFeedbacksData || []).forEach(f => {
      if (f && Array.isArray(f.users)) {
        f.users.forEach(u => {
          if (u && u.id && !runnerMap.has(u.id)) {
            runnerMap.set(u.id, u);
          }
        });
      }
    });
    return Array.from(runnerMap.values());
  }

  function getUniqueActiveRunners() {
    const runnerMap = new Map();
    (currentFeedbacksData || []).forEach(f => {
      if (f && Array.isArray(f.users)) {
        f.users.forEach(u => {
          if (u && u.id && !u.done && !runnerMap.has(u.id)) {
            runnerMap.set(u.id, u);
          }
        });
      }
    });
    return Array.from(runnerMap.values());
  }

  function renderRoulettePreview(runners) {
    if (!rouletteReelContainer) return;
    rouletteReelContainer.style.transition = 'none';
    rouletteReelContainer.style.transform = 'translateY(0px)';
    rouletteReelContainer.innerHTML = '';
    
    if (!runners || runners.length === 0) {
      rouletteReelContainer.innerHTML = `
        <div class="picker-card-2d empty-card">
          <span class="card-avatar-text">🌱</span>
          <span class="card-name">명단을 소환해보세요!</span>
        </div>
      `;
      return;
    }

    let cyclicRunners = [];
    for (let i = 0; i < 5; i++) {
      const setRunners = [...runners].sort(() => Math.random() - 0.5);
      cyclicRunners.push(...setRunners);
    }

    rouletteReelContainer.innerHTML = cyclicRunners.map(u => `
      <div class="picker-card-2d">
        <img src="${u.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">${getUserDisplayName(u)}</span>
      </div>
    `).join('');
  }

  function renderFeedbackList(feedbacks) {
    currentFeedbacksData = feedbacks || [];
    const container = getEl('feedback-list-container');
    if (!container) return;

    if (currentFeedbacksData.length === 0) {
      container.innerHTML = '<p class="empty-text">소환된 유저가 없습니다. 슬랙 메시지를 분석해 소환해보세요!</p>';
      if (startRaceBtn) startRaceBtn.classList.add('hidden');
      renderRoulettePreview([]);
      return;
    }

    if (startRaceBtn) startRaceBtn.classList.remove('hidden');
    const uniqueRunners = getUniqueActiveRunners();
    renderRoulettePreview(uniqueRunners);

    let html = '';
    currentFeedbacksData.forEach(f => {
      const emojiBadge = renderEmojiIcon(f.emoji, customEmojiCache);
      html += `
        <div class="feedback-group-item" style="background:#f8f9fa;border:1px solid #e4e5e7;border-radius:10px;padding:10px;margin-bottom:8px;">
          <div class="group-title" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;margin-bottom:6px;">
            <span>${emojiBadge} (${f.users ? f.users.length : 0}명)</span>
            <button class="btn-danger-xs" data-link="${f.messageLink}" data-emoji="${f.emoji}">삭제</button>
          </div>
          <div class="group-users" style="display:flex;flex-wrap:wrap;gap:4px;">
            ${(f.users || []).map(u => `
              <span class="user-tag" style="font-size:11px;background:#ffffff;padding:2px 6px;border-radius:6px;border:1px solid #e4e5e7;${u.done ? 'text-decoration:line-through;opacity:0.5;' : ''}">${getUserDisplayName(u)}</span>
            `).join('')}
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.btn-danger-xs').forEach(btn => {
      btn?.addEventListener('click', async (e) => {
        const link = e.target.dataset.link;
        const emoji = e.target.dataset.emoji;
        const updated = await SlackApi.deleteFeedbackGroup(link, emoji);
        renderFeedbackList(updated);
      });
    });
  }

  // Init Main Screen
  loadMainMeadow();

  async function loadMainMeadow() {
    customEmojiCache = await SlackApi.fetchCustomEmojis();
    currentFeedbacksData = [];
    renderFeedbackList([]);
    renderRoulettePreview([]);
  }

  // 🛡️ Safe Stepper Controls
  const btnWinnerMinus = getEl('btn-winner-minus');
  const btnWinnerPlus = getEl('btn-winner-plus');
  const btnTeamMinus = getEl('btn-team-minus');
  const btnTeamPlus = getEl('btn-team-plus');

  btnWinnerMinus?.addEventListener('click', () => {
    if (winnerCountInput) {
      const val = Math.max(1, (parseInt(winnerCountInput.value) || 1) - 1);
      winnerCountInput.value = val;
    }
  });

  btnWinnerPlus?.addEventListener('click', () => {
    if (winnerCountInput) {
      const val = Math.min(50, (parseInt(winnerCountInput.value) || 1) + 1);
      winnerCountInput.value = val;
    }
  });

  btnTeamMinus?.addEventListener('click', () => {
    if (teamCountInput) {
      const val = Math.max(2, (parseInt(teamCountInput.value) || 2) - 1);
      teamCountInput.value = val;
    }
  });

  btnTeamPlus?.addEventListener('click', () => {
    if (teamCountInput) {
      const val = Math.min(10, (parseInt(teamCountInput.value) || 2) + 1);
      teamCountInput.value = val;
    }
  });

  bottomSheetHandle?.addEventListener('click', () => {
    bottomSheet?.classList.toggle('collapsed');
  });

  btnPasteClip?.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.includes('slack.com/archives/')) {
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
          if (match && slackUrlInput) {
            slackUrlInput.value = match[0];
          }
        }
      }
    } catch (e) {
      alert('클립보드 접근 권한이 없습니다. 직접 붙여넣어주세요.');
    }
  });

  btnSummonChannelAll?.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !currentAnalyzedMessage.channel) {
      alert('슬랙 링크를 먼저 분석해주시거나 채널 정보가 필요합니다!');
      return;
    }
    
    const uniqueUserMap = new Map();
    (currentUnreactedUsers || []).forEach(u => uniqueUserMap.set(u.id, u));
    
    if (currentAnalyzedMessage.reactions) {
      currentAnalyzedMessage.reactions.forEach(r => {
        (r.users || []).forEach(u => uniqueUserMap.set(u.id, u));
      });
    }

    const uniqueChannelUsers = shuffleArray(Array.from(uniqueUserMap.values()));
    if (uniqueChannelUsers.length === 0) {
      alert('채널 인원을 불러올 수 없습니다.');
      return;
    }

    const updated = await SlackApi.saveFeedbackGroup(
      slackUrlInput ? slackUrlInput.value.trim() : '', 
      '', 
      `🌐 채널 전체 (${uniqueChannelUsers.length}명)`, 
      uniqueChannelUsers
    );
    renderFeedbackList(updated);
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(-33.333%)';
    bottomSheet?.classList.remove('collapsed');
  });

  analyzerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = slackUrlInput ? slackUrlInput.value.trim() : '';
    setLoading(true);
    statusContainer?.classList.add('hidden');

    try {
      const messageData = await SlackApi.analyzeSlackUrl(url);
      currentAnalyzedMessage = messageData;
      renderAnalysisResult(messageData);
      resultSection?.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  function renderAnalysisResult(msg) {
    if (!msg) return;
    if (messageAvatar) messageAvatar.src = msg.user?.avatar || 'https://via.placeholder.com/40';
    if (messageAuthor) messageAuthor.textContent = getUserDisplayName(msg.user);

    if (messageTime) {
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
    }

    if (messageText) messageText.innerHTML = parseTextEmojis(msg.text, customEmojiCache);

    currentUnreactedUsers = msg.unreactedUsers || [];
    if (unreactedCountBadge) unreactedCountBadge.textContent = currentUnreactedUsers.length;
    renderUnreactedList(currentUnreactedUsers);

    if (emojiFilterChips) {
      emojiFilterChips.innerHTML = '';
      const reactions = msg.reactions || [];

      reactions.forEach(r => {
        const chip = document.createElement('div');
        chip.className = 'emoji-chip';
        chip.dataset.emojiName = r.name;
        chip.innerHTML = `<span class="chip-icon">${renderEmojiIcon(r.name, customEmojiCache)}</span> <span class="chip-count">${r.count}</span>`;

        chip.addEventListener('click', () => {
          emojiFilterChips.querySelectorAll('.emoji-chip').forEach(c => c.classList.remove('selected'));
          chip.classList.add('selected');
          updateSelectedEmojiDetail(r);
        });
        emojiFilterChips.appendChild(chip);
      });
    }

    if (selectAllEmojis) selectAllEmojis.checked = false;
    renderUserAnalysisPanel(msg.reactions || []);
  }

  function renderUnreactedList(users) {
    if (!unreactedUserList) return;
    unreactedUserList.innerHTML = '';
    if (!users || users.length === 0) {
      unreactedUserList.innerHTML = '<p class="empty-text">해당 채널의 모든 유저가 이모지를 달았습니다! 🎉</p>';
      return;
    }

    users.forEach(u => {
      const displayName = getUserDisplayName(u);
      const item = document.createElement('div');
      item.className = 'unreacted-user-item';
      item.innerHTML = `
        <img src="${u.avatar || 'https://via.placeholder.com/22'}" alt="${displayName}">
        <span>${displayName}</span>
      `;
      unreactedUserList.appendChild(item);
    });
  }

  tabBtnEmojis?.addEventListener('click', () => {
    tabBtnEmojis.classList.add('active');
    tabBtnUnreacted?.classList.remove('active');
    tabContentEmojis?.classList.remove('hidden');
    tabContentUnreacted?.classList.add('hidden');
  });

  tabBtnUnreacted?.addEventListener('click', () => {
    tabBtnUnreacted.classList.add('active');
    tabBtnEmojis?.classList.remove('active');
    tabContentUnreacted?.classList.remove('hidden');
    tabContentEmojis?.classList.add('hidden');
  });

  btnCopyUnreacted?.addEventListener('click', () => {
    if (currentUnreactedUsers.length === 0) return;
    const names = currentUnreactedUsers.map(u => getUserDisplayName(u)).join(' ');
    navigator.clipboard.writeText(names);
    alert(`미반응자 ${currentUnreactedUsers.length}명의 이름이 복사되었습니다!`);
  });

  btnSummonUnreacted?.addEventListener('click', async () => {
    if (currentUnreactedUsers.length === 0) return;
    const shuffled = shuffleArray(currentUnreactedUsers);
    const updated = await SlackApi.saveFeedbackGroup(slackUrlInput ? slackUrlInput.value.trim() : '', '', '🚨 이모지 미반응자', shuffled);
    renderFeedbackList(updated);
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(-33.333%)';
  });

  function updateSelectedEmojiDetail(reactionData) {
    if (!reactionData) return;
    activeEmojiGroup = reactionData;
    if (selectedEmojiDetail) selectedEmojiDetail.classList.remove('hidden');
    if (detailEmojiBadge) detailEmojiBadge.innerHTML = renderEmojiIcon(reactionData.name, customEmojiCache);
    if (detailEmojiCount) detailEmojiCount.textContent = `${reactionData.users ? reactionData.users.length : 0}명`;

    if (detailUserList) {
      detailUserList.innerHTML = shuffleArray(reactionData.users || []).map(u => `
        <div class="user-chip" style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f7;padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">
          <img src="${u.avatar || 'https://via.placeholder.com/20'}" style="width:18px;height:18px;border-radius:50%;">
          <span>${getUserDisplayName(u)}</span>
        </div>
      `).join('');
    }
  }

  addToFeedbackBtn?.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !activeEmojiGroup) return;
    const shuffledUsers = shuffleArray(activeEmojiGroup.users);
    const updated = await SlackApi.saveFeedbackGroup(
      slackUrlInput ? slackUrlInput.value.trim() : '',
      currentAnalyzedMessage.text,
      activeEmojiGroup.name,
      shuffledUsers
    );
    renderFeedbackList(updated);
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(-33.333%)';
  });

  const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
  gameModeRadios.forEach(radio => {
    radio?.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'group') {
        configPodium?.classList.add('hidden');
        configGroup?.classList.remove('hidden');
        rouletteStage?.classList.add('hidden');
        groupDealerStage?.classList.remove('hidden');
        if (startRaceBtn) startRaceBtn.textContent = '🎴 팀 나누기!';
      } else {
        configGroup?.classList.add('hidden');
        configPodium?.classList.remove('hidden');
        groupDealerStage?.classList.add('hidden');
        rouletteStage?.classList.remove('hidden');
        if (startRaceBtn) startRaceBtn.textContent = '🎰 추첨 시작!';
      }
    });
  });

  startRaceBtn?.addEventListener('click', () => {
    runSingleLotterySpin();
  });

  function runSingleLotterySpin() {
    const activeRunners = getUniqueActiveRunners();
    if (activeRunners.length === 0) {
      alert('추첨할 남은 유저가 없습니다! 🎉');
      return;
    }

    const allRunners = getAllRunners();
    const modeRadio = document.querySelector('input[name="game-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'podium';
    const elements = { rouletteReelContainer, groupBoxesGrid, raceCommentary, commentaryText };

    if (mode === 'podium') {
      LotteryEngine.pickSingleWinner(allRunners, elements, (winner) => {
        if (winner) {
          pickedWinners.push(winner);
          currentFeedbacksData.forEach(f => {
            if (f && Array.isArray(f.users)) {
              f.users.forEach(u => {
                if (u.id === winner.id) u.done = true;
              });
            }
          });
          renderFeedbackList(currentFeedbacksData);
        }
        showFinalResultView('podium', pickedWinners);
      });
    } else {
      const teamCount = Math.min(parseInt(teamCountInput ? teamCountInput.value : 2) || 2, activeRunners.length);
      LotteryEngine.startGroupDealer(activeRunners, teamCount, elements, (m, teams) => {
        lastGroupResult = teams;
        showFinalResultView('group', teams);
      });
    }
  }

  const rankingScrollContainer = getEl('ranking-scroll-container');

  function showFinalResultView(mode, resultData) {
    if (raceCommentary) raceCommentary.classList.add('hidden');
    if (bottomSheet) bottomSheet.classList.remove('collapsed');
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(-66.666%)';

    if (mode === 'podium') {
      if (rankingListView) rankingListView.classList.remove('hidden');
      if (groupRankingView) groupRankingView.classList.add('hidden');
      const remainingCount = getUniqueActiveRunners().length;
      
      if (rankingRetryBtn) {
        const btnTextEl = rankingRetryBtn.querySelector('.btn-text');
        if (btnTextEl) {
          btnTextEl.textContent = remainingCount > 0 
            ? `🎰 다음 당첨자 뽑기 (남은 ${remainingCount}명)` 
            : '🎉 추첨 완료';
        }
        rankingRetryBtn.disabled = (remainingCount === 0);
      }

      if (rankingListView) {
        rankingListView.innerHTML = (resultData || []).map((w, idx) => `
          <div class="winner-result-card" id="winner-card-${idx}">
            <span class="winner-rank-badge">${idx + 1}등</span>
            <img src="${w.avatar || 'https://via.placeholder.com/44'}" class="winner-avatar">
            <div class="winner-info">
              <div class="name">${getUserDisplayName(w)}</div>
              <div style="font-size:12px;color:#64748b;">🎉 축하합니다! (자동 중복제외 적용)</div>
            </div>
          </div>
        `).join('');
      }

      setTimeout(() => {
        if (rankingScrollContainer) {
          rankingScrollContainer.scrollTop = rankingScrollContainer.scrollHeight;
        }
      }, 50);
    } else {
      if (groupRankingView) groupRankingView.classList.remove('hidden');
      if (rankingListView) rankingListView.classList.add('hidden');
      if (rankingRetryBtn) {
        const btnTextEl = rankingRetryBtn.querySelector('.btn-text');
        if (btnTextEl) btnTextEl.textContent = '다시 조 짜기';
        rankingRetryBtn.disabled = false;
      }

      if (groupRankingView) {
        groupRankingView.innerHTML = (resultData || []).map((team, tIdx) => `
          <div class="panel-card" style="text-align:left;margin-bottom:8px;">
            <h4 style="color:var(--primary);margin-bottom:6px;">TEAM ${tIdx + 1} (${team.length}명)</h4>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${team.map(m => `<span class="group-member-pill">${getUserDisplayName(m)}</span>`).join('')}
            </div>
          </div>
        `).join('');
      }
    }
  }

  btnCopyResultFormatted?.addEventListener('click', () => {
    const modeRadio = document.querySelector('input[name="game-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'podium';
    if (mode === 'group' && lastGroupResult) {
      const lines = lastGroupResult.map((team, idx) => {
        const names = team.map(m => getUserDisplayName(m)).join(', ');
        return `• ${idx + 1}팀: ${names}`;
      });
      const copyText = lines.join('\n');
      navigator.clipboard.writeText(copyText);
      alert('팀 구성 명단이 클립보드에 복사되었습니다!\n\n' + copyText);
    } else if (pickedWinners.length > 0) {
      const copyText = pickedWinners.map((w, idx) => `${idx + 1}등: ${getUserDisplayName(w)}`).join('\n');
      navigator.clipboard.writeText(copyText);
      alert('당첨자 명단이 클립보드에 복사되었습니다!');
    }
  });

  rankingConfirmBtn?.addEventListener('click', () => {
    pickedWinners = [];
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(0%)';
    if (bottomSheet) bottomSheet.classList.add('collapsed');
    renderRoulettePreview(getUniqueActiveRunners());
  });

  rankingRetryBtn?.addEventListener('click', () => {
    const modeRadio = document.querySelector('input[name="game-mode"]:checked');
    const mode = modeRadio ? modeRadio.value : 'podium';
    if (mode === 'podium') {
      const remainingRunners = getUniqueActiveRunners();
      if (remainingRunners.length > 0) {
        runSingleLotterySpin();
      }
    } else {
      const runners = getUniqueActiveRunners();
      const teamCount = Math.min(parseInt(teamCountInput ? teamCountInput.value : 2) || 2, runners.length);
      const elements = { rouletteReelContainer, groupBoxesGrid, raceCommentary, commentaryText };
      LotteryEngine.startGroupDealer(runners, teamCount, elements, (m, teams) => {
        lastGroupResult = teams;
        showFinalResultView('group', teams);
      });
    }
  });

  btnPrevSlide?.addEventListener('click', () => {
    if (sliderWrapper) sliderWrapper.style.transform = 'translateX(0%)';
  });

  deleteAllRunnersBtn?.addEventListener('click', async () => {
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
    if (!submitBtn) return;
    const spinner = submitBtn.querySelector('.spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    if (loading) {
      if (spinner) spinner.classList.remove('hidden');
      if (btnText) btnText.textContent = '분석 중...';
      submitBtn.disabled = true;
    } else {
      if (spinner) spinner.classList.add('hidden');
      if (btnText) btnText.textContent = '이모지 가져오기';
      submitBtn.disabled = false;
    }
  }

  function showError(msg) {
    if (statusContainer) statusContainer.classList.remove('hidden');
    if (statusMessage) statusMessage.textContent = msg;
  }

  function renderUserAnalysisPanel(reactions) {
    const userMap = new Map();
    (reactions || []).forEach(r => {
      (r.users || []).forEach(u => {
        if (!userMap.has(u.id)) {
          userMap.set(u.id, { user: u, emojis: [] });
        }
        userMap.get(u.id).emojis.push(r.name);
      });
    });

    if (analysisTotalCount) analysisTotalCount.textContent = `총 ${userMap.size}명`;
    if (analysisUserList) {
      analysisUserList.innerHTML = Array.from(userMap.values()).map(item => `
        <div class="user-analysis-item" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(0,0,0,0.05);">
          <span style="font-size:12px;font-weight:600;">${getUserDisplayName(item.user)}</span>
          <span>${item.emojis.map(e => renderEmojiIcon(e, customEmojiCache)).join(' ')}</span>
        </div>
      `).join('');
    }
  }

  btnToggleUserAnalysis?.addEventListener('click', () => {
    if (userAnalysisPanel) userAnalysisPanel.classList.toggle('hidden');
  });

  btnCopySpacedNames?.addEventListener('click', () => {
    const runners = getUniqueActiveRunners();
    if (runners.length === 0) return;
    const names = runners.map(u => getUserDisplayName(u)).join(' ');
    navigator.clipboard.writeText(names);
    alert(`명단 ${runners.length}명의 이름이 복사되었습니다!`);
  });
});
