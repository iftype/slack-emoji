// 슬랙 대표 이모지 숏코드 -> 유니코드 매핑 딕셔너리
const EMOJI_MAP = {
  'thumbsup': '👍', '+1': '👍', 'thumbsdown': '👎', '-1': '👎',
  'heart': '❤️', 'smile': '😄', 'check': '✅', 'white_check_mark': '✅',
  'party_popper': '🎉', 'tada': '🎉', 'thinking_face': '🤔',
  'eyes': '👀', 'fire': '🔥', 'sparkles': '✨', 'rocket': '🚀',
  'pray': '🙏', 'raised_hands': '🙌', 'clap': '👏', 'sob': '😭',
  'cry': '😢', 'joy': '😂', 'sweat_smile': '😅', 'rolling_on_the_floor_laughing': '🤣',
  'heart_eyes': '😍', 'scream': '😱', 'poop': '💩', 'warning': '⚠️',
  'lightbulb': '💡', '100': '💯',
  'clinking_glasses': '🥂', 'beer': '🍺', 'pizza': '🍕', 'coffee': '☕',
  'star': '⭐', 'star2': '🌟', 'sparkler': '🎇', 'balloon': '🎈',
  'gift': '🎁', 'trophy': '🏆', 'first_place_medal': '🥇',
  'x': '❌', 'heavy_check_mark': 'Heavy Check Mark', 'heavy_plus_sign': '➕',
  'wave': '👋', 'ok_hand': '👌', 'v': '✌️', 'muscle': '💪', 'brain': '🧠',
  'zero': '0️⃣', 'one': '1️⃣', 'two': '2️⃣', 'three': '3️⃣', 'four': '4️⃣',
  'five': '5️⃣', 'six': '6️⃣', 'seven': '7️⃣', 'eight': '8️⃣', 'nine': '9️⃣',
  'keycap_ten': '🔟', '1234': '🔢'
};

// API 서버 기본 경로 (GitHub Pages에서 오라클 서버로 호출)
function getApiBase() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return ''; // 로컬 개발: 같은 서버
  }
  return 'https://iftype.store/slack'; // 프로덕션: 오라클 서버
}

// 숏코드 이모지 치환기
function parseTextEmojis(text, customEmojiMap = {}) {
  if (!text) return '';
  let cleanText = text.replace(/<(https?:\/\/[^>|]+)(\|[^>]+)?>/g, (match, url, label) => {
    const textLabel = label ? label.slice(1) : url;
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="message-link">${textLabel}</a>`;
  });
  cleanText = cleanText.replace(/<@([A-Z0-9]+)>/g, '<span class="user-mention">@$1</span>');
  
  return cleanText.replace(/:([a-zA-Z0-9_+\-]+):/g, (match, code) => {
    if (EMOJI_MAP[code]) return EMOJI_MAP[code];
    if (customEmojiMap && customEmojiMap[code]) {
      const imgUrl = customEmojiMap[code];
      if (imgUrl.startsWith('alias:')) return match;
      return `<img src="${imgUrl}" alt=":${code}:" class="text-custom-emoji" title=":${code}:" />`;
    }
    return match;
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // DOM 엘리먼트 정의
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const loginTokenInput = document.getElementById('login-token');
  const loginCookieGroup = document.getElementById('login-cookie-group');
  const loginCookieInput = document.getElementById('login-cookie');

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

  // 탭 제어
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

  // 유저별 분석
  const btnToggleUserAnalysis = document.getElementById('btn-toggle-user-analysis');
  const userAnalysisPanel = document.getElementById('user-analysis-panel');
  const analysisTotalCount = document.getElementById('analysis-total-count');
  const btnCopySpacedNames = document.getElementById('btn-copy-spaced-names');
  const analysisUserList = document.getElementById('analysis-user-list');

  // 모바일 바텀 시트
  const bottomSheet = document.getElementById('bottom-sheet');
  const bottomSheetHandle = document.getElementById('bottom-sheet-handle');

  // 🎰 2D 추첨 무대 & 조짜기
  const rouletteStage = document.getElementById('roulette-stage');
  const rouletteReelContainer = document.getElementById('roulette-reel-container');
  const groupDealerStage = document.getElementById('group-dealer-stage');
  const groupBoxesGrid = document.getElementById('group-boxes-grid');

  const startRaceBtn = document.getElementById('start-race-btn');
  const raceCommentary = document.getElementById('race-commentary');
  const commentaryText = document.getElementById('commentary-text');
  const btnSkipRace = document.getElementById('btn-skip-race');

  // 결과창
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

  const sliderWrapper = document.getElementById('slider-wrapper');
  const btnPrevSlide = document.getElementById('btn-prev-slide');

  // 전역 데이터 상태
  let currentAnalyzedMessage = null;
  let activeEmojiGroup = null;
  let currentFeedbacksData = [];
  let customEmojiCache = {};
  let currentUnreactedUsers = [];

  // 🎰 추첨 애니메이션 제어 변수
  let isRolling = false;
  let rollAnimTimer = null;
  let reelY = 0;

  /* ====================================================
     1. 초기화 및 세션 연결 (서버 토큰 기본 사용)
     ==================================================== */
  loadMainMeadow('server-managed', '');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = loginTokenInput.value.trim();
    const cookie = loginCookieInput.value.trim();
    loadMainMeadow(token, cookie);
  });

  async function loadMainMeadow(token, cookie) {
    mainScreen.classList.remove('hidden');
    loginScreen.classList.add('hidden');

    try {
      const res = await fetch(`${getApiBase()}/api/emojis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token || '', cookie: cookie || '' })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        customEmojiCache = data.emoji || {};
      }
    } catch (e) {
      console.warn('이모지 로드 예외:', e.message);
    }

    loadFeedbacks(true);
    bottomSheet.classList.add('expanded');
    checkClipboardAndAutoPaste();
  }

  // 📋 클립보드에 슬랙 메시지 URL이 있으면 자동 감지 및 입력창 붙여넣기 (PC & 모바일)
  async function checkClipboardAndAutoPaste() {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.includes('slack.com/archives/')) {
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
          if (match && slackUrlInput.value !== match[0]) {
            slackUrlInput.value = match[0];
          }
        }
      }
    } catch (e) {
      // 클립보드 접근 권한 거부 시 안전하게 스킵
    }
  }

  window.addEventListener('focus', checkClipboardAndAutoPaste);

  /* ====================================================
     2. 슬랙 메시지 분석 및 결과 처리
     ==================================================== */
  analyzerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = slackUrlInput.value.trim();
    setLoading(true);
    statusContainer.classList.add('hidden');

    try {
      const res = await fetch(`${getApiBase()}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || '이모지 정보를 가져오는 데 실패했습니다.');
      }

      currentAnalyzedMessage = data.message;
      renderAnalysisResult(data.message);
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

    // 미반응자 (이모지 안 누른 채널 유저)
    currentUnreactedUsers = msg.unreactedUsers || [];
    unreactedCountBadge.textContent = currentUnreactedUsers.length;
    renderUnreactedList(currentUnreactedUsers);

    // 이모지 필터 칩
    emojiFilterChips.innerHTML = '';
    const reactions = msg.reactions || [];

    reactions.forEach(r => {
      const chip = document.createElement('div');
      chip.className = 'emoji-chip';
      chip.dataset.emojiName = r.name;
      chip.innerHTML = `<span class="chip-icon">${renderEmojiIcon(r.name)}</span> <span class="chip-name">:${r.name}:</span> <span class="chip-count">${r.count}</span>`;

      chip.addEventListener('click', () => {
        chip.classList.toggle('selected');
        updateSelectedEmojiDetail(r);
      });
      emojiFilterChips.appendChild(chip);
    });

    if (reactions.length > 0) {
      selectAllEmojis.checked = false;
    }

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

  // 탭 전환
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

  // 미반응자 명단 복사
  btnCopyUnreacted.addEventListener('click', () => {
    if (currentUnreactedUsers.length === 0) return;
    const names = currentUnreactedUsers.map(u => u.real_name || u.name).join(' ');
    navigator.clipboard.writeText(names);
    alert(`미반응자 ${currentUnreactedUsers.length}명의 이름이 복사되었습니다!`);
  });

  // 미반응자 추첨기 소환
  btnSummonUnreacted.addEventListener('click', () => {
    if (currentUnreactedUsers.length === 0) return;
    saveFeedbackGroup('🚨 이모지 미반응자', currentUnreactedUsers);
  });

  function renderEmojiIcon(name) {
    if (EMOJI_MAP[name]) return EMOJI_MAP[name];
    if (customEmojiCache[name]) {
      return `<img src="${customEmojiCache[name]}" style="width:16px;height:16px;vertical-align:middle;">`;
    }
    return `:${name}:`;
  }

  function updateSelectedEmojiDetail(reactionData) {
    activeEmojiGroup = reactionData;
    selectedEmojiDetail.classList.remove('hidden');
    detailEmojiBadge.innerHTML = renderEmojiIcon(reactionData.name);
    detailEmojiCount.textContent = `${reactionData.users.length}명`;

    detailUserList.innerHTML = reactionData.users.map(u => `
      <div class="user-chip" style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">
        <img src="${u.avatar || 'https://via.placeholder.com/20'}" style="width:18px;height:18px;border-radius:50%;">
        <span>${u.real_name || u.name}</span>
      </div>
    `).join('');
  }

  function toggleSelectAllEmojis(isSelected) {
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
        <div class="user-chip" style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:12px;margin:2px;font-size:12px;">
          <img src="${u.avatar || 'https://via.placeholder.com/20'}" style="width:18px;height:18px;border-radius:50%;">
          <span>${u.real_name || u.name}</span>
        </div>
      `).join('');
    }
  }

  selectAllEmojis.addEventListener('change', (e) => toggleSelectAllEmojis(e.target.checked));

  addToFeedbackBtn.addEventListener('click', () => {
    if (!currentAnalyzedMessage || !activeEmojiGroup) return;
    saveFeedbackGroup(activeEmojiGroup.name, activeEmojiGroup.users);
  });

  async function saveFeedbackGroup(emojiName, users) {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageLink: slackUrlInput.value.trim() || 'Custom Group',
          messageText: currentAnalyzedMessage ? currentAnalyzedMessage.text : '',
          emoji: emojiName,
          users: users
        })
      });
      const data = await res.json();
      if (data.ok) {
        renderFeedbackList(data.feedbacks);
        sliderWrapper.style.transform = 'translateX(-33.333%)';
      }
    } catch (e) {
      alert('소환 에러: ' + e.message);
    }
  }

  /* ====================================================
     3. 추첨 명단 관리 및 무작위 추첨 롤러 엔진
     ==================================================== */
  async function loadFeedbacks(skipSync = false) {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`);
      const data = await res.json();
      if (data.ok) {
        renderFeedbackList(data.feedbacks);
      }
    } catch (e) {}
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
      html += `
        <div class="feedback-group-item" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px;margin-bottom:8px;">
          <div class="group-title" style="display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:700;margin-bottom:6px;">
            <span>:${f.emoji}: (${f.users.length}명)</span>
            <button class="btn-danger-xs" onclick="deleteGroup('${f.messageLink}', '${f.emoji}')">삭제</button>
          </div>
          <div class="group-users" style="display:flex;flex-wrap:wrap;gap:4px;">
            ${f.users.map(u => `
              <span class="user-tag" style="font-size:11px;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:6px;">${u.real_name || u.name}</span>
            `).join('')}
          </div>
        </div>
      `;
    });
    document.getElementById('feedback-list-container').innerHTML = html;
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

  // 모드 전환
  const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
  gameModeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'group') {
        configPodium.classList.add('hidden');
        configGroup.classList.remove('hidden');
        rouletteStage.classList.add('hidden');
        groupDealerStage.classList.remove('hidden');
      } else {
        configGroup.classList.add('hidden');
        configPodium.classList.remove('hidden');
        groupDealerStage.classList.add('hidden');
        rouletteStage.classList.remove('hidden');
      }
    });
  });

  /* ====================================================
     4. 무작위 추첨 애니메이션
     ==================================================== */
  startRaceBtn.addEventListener('click', runLotteryAnimation);

  function runLotteryAnimation() {
    const runners = getUniqueActiveRunners();
    if (runners.length === 0) {
      alert('추첨 대상 유저가 없습니다!');
      return;
    }

    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    raceCommentary.classList.remove('hidden');
    isRolling = true;

    if (mode === 'podium') {
      const winCount = Math.min(parseInt(winnerCountInput.value) || 1, runners.length);
      startReelRollAnimation(runners, winCount);
    } else {
      const teamCount = Math.min(parseInt(teamCountInput.value) || 2, runners.length);
      startGroupDivideAnimation(runners, teamCount);
    }
  }

  function startReelRollAnimation(runners, winCount) {
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

    function rollLoop() {
      if (!isRolling) return;
      let elapsed = Date.now() - startTime;
      let progress = elapsed / duration;

      if (progress < 1) {
        let speed = Math.max(2, 30 * (1 - Math.pow(progress, 2)));
        reelY -= speed;
        if (Math.abs(reelY) > 1200) reelY = 0;
        rouletteReelContainer.style.transform = `translateY(${reelY}px)`;
        rollAnimTimer = requestAnimationFrame(rollLoop);
      } else {
        finishReelLottery(winners);
      }
    }
    rollLoop();
  }

  function finishReelLottery(winners) {
    isRolling = false;
    cancelAnimationFrame(rollAnimTimer);
    commentaryText.textContent = `🎉 축하합니다! ${winners.length}명의 당첨자 선정!`;

    rouletteReelContainer.innerHTML = winners.map(w => `
      <div class="picker-card-2d winner-highlight">
        <img src="${w.avatar || 'https://via.placeholder.com/32'}" class="card-avatar">
        <span class="card-name">🎉 ${w.real_name || w.name}</span>
      </div>
    `).join('');
    rouletteReelContainer.style.transform = 'translateY(0px)';

    setTimeout(() => {
      showFinalResultView('podium', winners);
    }, 1200);
  }

  function startGroupDivideAnimation(runners, teamCount) {
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

    setTimeout(() => {
      showFinalResultView('group', teams);
    }, 1200);
  }

  btnSkipRace.addEventListener('click', () => {
    if (!isRolling) return;
    const mode = document.querySelector('input[name="game-mode"]:checked').value;
    const runners = getUniqueActiveRunners();
    if (mode === 'podium') {
      const winCount = Math.min(parseInt(winnerCountInput.value) || 1, runners.length);
      const winners = [...runners].sort(() => Math.random() - 0.5).slice(0, winCount);
      finishReelLottery(winners);
    } else {
      const teamCount = Math.min(parseInt(teamCountInput.value) || 2, runners.length);
      startGroupDivideAnimation(runners, teamCount);
    }
  });

  function showFinalResultView(mode, resultData) {
    raceCommentary.classList.add('hidden');
    sliderWrapper.style.transform = 'translateX(-66.666%)';

    if (mode === 'podium') {
      rankingListView.classList.remove('hidden');
      groupRankingView.classList.add('hidden');
      rankingListView.innerHTML = resultData.map((w, idx) => `
        <div class="winner-result-card">
          <span class="winner-rank-badge">${idx + 1}등</span>
          <img src="${w.avatar || 'https://via.placeholder.com/44'}" class="winner-avatar">
          <div class="winner-info">
            <div class="name">${w.real_name || w.name}</div>
            <div style="font-size:12px;color:#64748b;">🎉 축하합니다!</div>
          </div>
        </div>
      `).join('');
    } else {
      groupRankingView.classList.remove('hidden');
      rankingListView.classList.add('hidden');
      groupRankingView.innerHTML = resultData.map((team, tIdx) => `
        <div class="panel-card" style="text-align:left;margin-bottom:8px;">
          <h4 style="color:#4f46e5;margin-bottom:6px;">TEAM ${tIdx + 1} (${team.length}명)</h4>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${team.map(m => `<span class="group-member-pill">${m.real_name || m.name}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  rankingConfirmBtn.addEventListener('click', () => {
    sliderWrapper.style.transform = 'translateX(0%)';
  });

  rankingRetryBtn.addEventListener('click', () => {
    sliderWrapper.style.transform = 'translateX(-33.333%)';
    runLotteryAnimation();
  });

  btnPrevSlide.addEventListener('click', () => {
    sliderWrapper.style.transform = 'translateX(0%)';
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
      <div class="user-analysis-item" style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-size:12px;">${item.user.real_name || item.user.name}</span>
        <span>${item.emojis.map(e => renderEmojiIcon(e)).join(' ')}</span>
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
