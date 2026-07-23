// API 서버 기본 경로 (GitHub Pages에서 오라클 서버로 호출)
function getApiBase() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return '';  // 로컬 개발: 같은 서버
  }
  return 'https://iftype.store/slack';  // 프로덕션: 오라클 서버
}

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
  'skateboard': '🛹', 'skate': '🛹'
};

// 슬랙 커스텀 이모지 캐시
let customEmojiCache = {};

// 이모지 렌더링 헬퍼
function getEmojiDisplay(emojiName) {
  if (customEmojiCache[emojiName]) {
    return `<img class="custom-emoji-img" src="${customEmojiCache[emojiName]}" alt="${emojiName}">`;
  }
  if (EMOJI_MAP[emojiName]) return EMOJI_MAP[emojiName];
  if (emojiName.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/)) return emojiName;
  return `:${emojiName}:`;
}

// 닉네임/실명 단독 대표값 반환 (괄호 병기 제거)
function getUserDisplayName(u) {
  return u.display_name || u.real_name || u.name || '알 수 없는 사용자';
}

// 💬 본문 원문 내 숏코드 이모지 치환기
function parseTextEmojis(text) {
  if (!text) return '';
  return text.replace(/:([a-zA-Z0-9_+-]+):/g, (match, emojiName) => {
    return getEmojiDisplay(emojiName);
  });
}

function formatTimestamp(ts) {
  try {
    const date = new Date(parseFloat(ts) * 1000);
    return date.toLocaleString('ko-KR', {
      month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return ts;
  }
}

// 🖼️ Canvas 누끼 따기
function removeBackground(imgSrc) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        
        const isBlackLine = r < 95 && g < 95 && b < 95;
        const isWhiteFill = r > 215 && g > 215 && b > 215;
        
        if (isBlackLine) {
          data[i] = 0;
          data[i+1] = 0;
          data[i+2] = 0;
          data[i+3] = 255; 
        } else if (isWhiteFill) {
          data[i] = 255;
          data[i+1] = 255;
          data[i+2] = 255;
          data[i+3] = 255;
        } else {
          data[i+3] = 0; 
        }
      }
      
      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => {
      resolve(imgSrc);
    };
    img.src = imgSrc;
  });
}

/* ====================================================
   🔊 브라우저 내장 Web Audio API 효과음 엔진 (SFX)
   ==================================================== */
class SoundFXEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playBeep(freq = 600, duration = 0.12) {
    this.init();
    if (!this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playShot() {
    this.init();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    noiseNode.start();
    noiseNode.stop(this.ctx.currentTime + 0.4);
    
    this.playBeep(85, 0.25);
  }

  playSplat() {
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playWoohoo() {
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25];
    const now = this.ctx.currentTime;
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      
      gainNode.gain.setValueAtTime(0, now + idx * 0.12);
      gainNode.gain.linearRampToValueAtTime(0.05, now + idx * 0.12 + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.5);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);
      
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.5);
    });
  }
}

const sfx = new SoundFXEngine();

document.addEventListener('DOMContentLoaded', async () => {
  // DOM 엘리먼트 정의
  const mainScreen = document.getElementById('main-screen');
  const analyzerForm = document.getElementById('analyzer-form');
  const slackUrlInput = document.getElementById('slack-url');
  const submitBtn = document.getElementById('submit-btn');
  const spinner = submitBtn.querySelector('.spinner');
  const btnText = submitBtn.querySelector('.btn-text');

  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');

  const resultSection = document.getElementById('result-section');
  const messageAvatar = document.getElementById('message-avatar');
  const messageAuthor = document.getElementById('message-author');
  const messageTime = document.getElementById('message-time');
  const messageText = document.getElementById('message-text');

  const emojiFilterChips = document.getElementById('emoji-filter-chips');
  const selectedEmojiDetail = document.getElementById('selected-emoji-detail');
  const detailEmojiBadge = document.getElementById('detail-emoji-badge');
  const detailEmojiCount = document.getElementById('detail-emoji-count');
  const detailUserList = document.getElementById('detail-user-list');
  const addToFeedbackBtn = document.getElementById('add-to-feedback-btn');

  // 📊 명단 분석용 DOM 엘리먼트
  const btnToggleUserAnalysis = document.getElementById('btn-toggle-user-analysis');
  const userAnalysisPanel = document.getElementById('user-analysis-panel');
  const analysisTotalCount = document.getElementById('analysis-total-count');
  const btnCopySpacedNames = document.getElementById('btn-copy-spaced-names');
  const analysisUserList = document.getElementById('analysis-user-list');

  // 🌲 배경 나무용 엘리먼트 
  const parallaxTrees = document.querySelectorAll('.parallax-tree');

  const feedbackListContainer = document.getElementById('feedback-list-container');
  const characterContainer = document.getElementById('character-container');
  const meadowCanvas = document.getElementById('meadow-canvas');

  // 🎥 카메라 스테이지 및 3단 슬라이더
  const cameraStage = document.getElementById('camera-stage');
  const sliderWrapper = document.getElementById('slider-wrapper');
  const btnPrevSlide = document.getElementById('btn-prev-slide');

  // 모바일 바텀 시트
  const bottomSheet = document.getElementById('bottom-sheet');
  const bottomSheetHandle = document.getElementById('bottom-sheet-handle');

  // 🏁 경주 제어 및 결과 오버레이
  const startRaceBtn = document.getElementById('start-race-btn');
  const raceCountdown = document.getElementById('race-countdown');
  const raceCommentary = document.getElementById('race-commentary');
  const commentaryText = document.getElementById('commentary-text');
  const btnSkipRace = document.getElementById('btn-skip-race');

  // 👑 슬라이드 3 결과창 엘리먼트
  const rankingListView = document.getElementById('ranking-list-view');
  const groupRankingView = document.getElementById('group-ranking-view');
  const rankingConfirmBtn = document.getElementById('ranking-confirm-btn');

  // 🔲 이모지 결과 전체 선택
  const selectAllEmojis = document.getElementById('select-all-emojis');

  // 📋 명단 제어 액션 버튼
  const selectAllRunnersBtn = document.getElementById('select-all-runners-btn');
  const deleteAllRunnersBtn = document.getElementById('delete-all-runners-btn');

  // 🎮 게임 모드 패널 필드
  const gameModePanel = document.getElementById('game-mode-panel');
  const configPodium = document.getElementById('config-podium');
  const configGroup = document.getElementById('config-group');
  const winnerCountInput = document.getElementById('winner-count-input');
  const teamCountInput = document.getElementById('team-count-input');

  // 전역 상태 변수
  let currentAnalyzedMessage = null; 
  let activeEmojiGroup = null; 
  let currentFeedbacksData = []; 
  
  // 📊 고유 참가자 맵 캐시
  let currentUserEmojiMap = new Map();

  // 가공 완료된 스프라이트 이미지 캐시
  const transparentImages = {
    run: '',
    struggle1: '',
    struggle2: '',
    walk: ''
  };

  // 캐릭터 관리 맵
  let spawnedCharacters = new Map(); 

  // 🏁 경주 상태 변수
  let isRacing = false;
  let raceAnimationFrameId = null;

  // LERP 카메라 및 동적 줌 변수
  let camX = 0;
  let camY = 0;
  let currentZoom = 1.1; 
  let totalRunnersCount = 1;

  // 🎮 경기 모드 속성 ('podium' | 'group')
  let selectedGameMode = 'podium'; 
  let selectedWinnersList = [];
  let generatedGroupsList = [];

  // 💀 탈락 순위 큐
  let eliminatedQueue = [];

  // 이미지 전처리 가공
  async function initTransparentImages() {
    transparentImages.run = await removeBackground('char_run.png');
    transparentImages.struggle1 = await removeBackground('char_struggle1.png');
    transparentImages.struggle2 = await removeBackground('char_struggle2.png');
    transparentImages.walk = await removeBackground('char_walk.png');
  }

  /* ====================================================
     🎥 가로 3단 슬라이더 네비게이션 제어
     ==================================================== */
  function goToSlide(slideNum) {
    if (slideNum === 3) {
      sliderWrapper.className = 'slider-wrapper slide-to-3';
    } else if (slideNum === 2) {
      sliderWrapper.className = 'slider-wrapper slide-to-2';
    } else {
      sliderWrapper.className = 'slider-wrapper';
    }
  }

  btnPrevSlide.addEventListener('click', () => {
    goToSlide(1);
  });

  /* ====================================================
     📋 클립보드 슬랙 링크 오토페이스트 기능
     ==================================================== */
  async function checkClipboardAndPaste() {
    try {
      if (document.visibilityState !== 'visible') return;

      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      
      if (trimmed.includes('.slack.com/archives/')) {
        if (slackUrlInput.value !== trimmed) {
          slackUrlInput.value = trimmed;
          
          slackUrlInput.style.borderColor = 'var(--primary)';
          slackUrlInput.style.boxShadow = '0 0 0 3px var(--primary-glow)';
          setTimeout(() => {
            slackUrlInput.style.borderColor = '';
            slackUrlInput.style.boxShadow = '';
          }, 1500);
        }
      }
    } catch (e) {
      console.debug('클립보드 읽기 불가 또는 권한 제한');
    }
  }

  window.addEventListener('focus', checkClipboardAndPaste);
  document.addEventListener('visibilitychange', checkClipboardAndPaste);
  document.addEventListener('click', checkClipboardAndPaste, { once: true });

  /* ====================================================
     🎮 게임 모드 라디오 탭 변환 바인딩
     ==================================================== */
  document.querySelectorAll('input[name="game-mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedGameMode = e.target.value;
      if (selectedGameMode === 'podium') {
        configPodium.classList.remove('hidden');
        configGroup.classList.add('hidden');
      } else {
        configPodium.classList.add('hidden');
        configGroup.classList.remove('hidden');
      }
      
      applyRealtimeGroupColors();
    });
  });

  teamCountInput.addEventListener('change', () => {
    if (selectedGameMode === 'group') {
      applyRealtimeGroupColors();
    }
  });

  function applyRealtimeGroupColors() {
    const activeRunners = Array.from(spawnedCharacters.keys());
    if (activeRunners.length === 0) return;

    if (selectedGameMode === 'group') {
      const M = parseInt(teamCountInput.value) || 2;
      activeRunners.forEach((uid, idx) => {
        const charState = spawnedCharacters.get(uid);
        if (charState) {
          const groupIdx = idx % M;
          charState.element.className = `meadow-character team-${groupIdx}`;
        }
      });
    } else {
      activeRunners.forEach(uid => {
        const charState = spawnedCharacters.get(uid);
        if (charState) {
          charState.element.className = 'meadow-character';
        }
      });
    }
  }

  /* ====================================================
     1. 서버 토큰 전용 — 로그인 화면 없이 바로 시작
     ==================================================== */
  localStorage.removeItem('slack_emoji_analyzer_token');
  localStorage.removeItem('slack_emoji_analyzer_cookie');
  loadMainMeadow();

  /* ====================================================
     2. 메인 Meadow 서비스 로드 및 이모지 캐싱
     ==================================================== */

  async function loadMainMeadow() {
    mainScreen.classList.remove('hidden');

    await initTransparentImages();

    try {
      const res = await fetch(`${getApiBase()}/api/emojis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        customEmojiCache = data.emoji || {};
      }
    } catch (e) {
      console.warn('커스텀 이모지 로드 실패:', e.message);
    }

    loadFeedbacks(true);
    bottomSheet.classList.add('expanded');
    checkClipboardAndPaste();
  }

  /* ====================================================
     2.1 슬랙 메시지 분석 및 결과 출력
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
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      spinner.classList.remove('hidden');
      btnText.textContent = '가져오는 중...';
    } else {
      submitBtn.disabled = false;
      spinner.classList.add('hidden');
      btnText.textContent = '이모지 가져오기';
    }
  }

  function showError(msg) {
    statusContainer.classList.remove('hidden');
    statusMessage.className = 'status-message error';
    statusMessage.textContent = msg;
  }

  function renderAnalysisResult(message) {
    resultSection.classList.remove('hidden');
    selectedEmojiDetail.classList.add('hidden');
    activeEmojiGroup = null;

    userAnalysisPanel.classList.add('hidden');

    messageAvatar.src = message.user.avatar || 'https://via.placeholder.com/72?text=?';
    messageAuthor.textContent = getUserDisplayName(message.user);
    messageTime.textContent = formatTimestamp(message.ts);
    
    messageText.innerHTML = parseTextEmojis(message.text);

    emojiFilterChips.innerHTML = '';
    if (message.reactions.length === 0) {
      emojiFilterChips.innerHTML = '<p class="text-muted">등록된 이모지 반응이 없습니다.</p>';
      return;
    }

    message.reactions.forEach(r => {
      const chip = document.createElement('div');
      chip.className = 'filter-chip';
      chip.innerHTML = `${getEmojiDisplay(r.name)} <span class="chip-count">${r.count}</span>`;
      chip.addEventListener('click', () => {
        selectAllEmojis.checked = false;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectEmojiGroup(r);
      });
      emojiFilterChips.appendChild(chip);
    });

    selectAllEmojis.checked = false;
    const firstChip = emojiFilterChips.querySelector('.filter-chip');
    if (firstChip) {
      firstChip.click();
    }

    currentUserEmojiMap.clear();
    message.reactions.forEach(r => {
      r.users.forEach(u => {
        if (!currentUserEmojiMap.has(u.id)) {
          currentUserEmojiMap.set(u.id, {
            user: u,
            emojis: new Set()
          });
        }
        currentUserEmojiMap.get(u.id).emojis.add(r.name);
      });
    });

    analysisTotalCount.textContent = `총 ${currentUserEmojiMap.size}명`;

    analysisUserList.innerHTML = '';
    currentUserEmojiMap.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'analysis-user-row';

      const prof = document.createElement('div');
      prof.className = 'analysis-user-profile';
      prof.innerHTML = `
        <img class="analysis-user-avatar" src="${item.user.avatar || 'https://via.placeholder.com/32?text=?'}" alt="avatar">
        <span class="analysis-user-name">${getUserDisplayName(item.user)}</span>
      `;

      const emojis = document.createElement('div');
      emojis.className = 'analysis-user-emojis';
      item.emojis.forEach(emojiName => {
        const span = document.createElement('span');
        span.className = 'analysis-emoji-badge';
        span.innerHTML = getEmojiDisplay(emojiName);
        emojis.appendChild(span);
      });

      row.appendChild(prof);
      row.appendChild(emojis);
      analysisUserList.appendChild(row);
    });
  }

  btnToggleUserAnalysis.addEventListener('click', () => {
    userAnalysisPanel.classList.toggle('hidden');
  });

  btnCopySpacedNames.addEventListener('click', async () => {
    if (currentUserEmojiMap.size === 0) {
      alert('분석된 명단이 비어있습니다.');
      return;
    }

    try {
      const namesArray = [];
      currentUserEmojiMap.forEach((item) => {
        namesArray.push(getUserDisplayName(item.user));
      });

      const copyStr = namesArray.join(' ');
      await navigator.clipboard.writeText(copyStr);
      alert(`📋 고유 반응자 이름들이 스페이스로 구분되어 복사되었습니다!\n(${copyStr})`);
    } catch (err) {
      alert('클립보드 복사에 실패했습니다.');
    }
  });

  // 🔲 전체 선택 토글
  selectAllEmojis.addEventListener('change', (e) => {
    if (!currentAnalyzedMessage) return;
    
    const chips = document.querySelectorAll('.filter-chip');
    if (e.target.checked) {
      chips.forEach(c => c.classList.add('active'));
      
      const allUsersMap = new Map();
      currentAnalyzedMessage.reactions.forEach(r => {
        r.users.forEach(u => {
          allUsersMap.set(u.id, u);
        });
      });

      const mergedUsers = Array.from(allUsersMap.values());
      activeEmojiGroup = {
        name: '전체 이모지 반응자',
        count: mergedUsers.length,
        users: mergedUsers
      };

      selectedEmojiDetail.classList.remove('hidden');
      detailEmojiBadge.innerHTML = '🌟 전체 선택';
      detailEmojiCount.textContent = `${mergedUsers.length}명`;

      detailUserList.innerHTML = '';
      mergedUsers.forEach(u => {
        const chip = document.createElement('div');
        chip.className = 'user-chip';
        chip.innerHTML = `
          <img class="chip-avatar" src="${u.avatar || 'https://via.placeholder.com/32?text=?'}" alt="${getUserDisplayName(u)}">
          <span class="chip-name">${getUserDisplayName(u)}</span>
        `;
        detailUserList.appendChild(chip);
      });
    } else {
      chips.forEach(c => c.classList.remove('active'));
      selectedEmojiDetail.classList.add('hidden');
      activeEmojiGroup = null;
    }
  });

  function selectEmojiGroup(reaction) {
    activeEmojiGroup = reaction;
    selectedEmojiDetail.classList.remove('hidden');

    detailEmojiBadge.innerHTML = getEmojiDisplay(reaction.name);
    detailEmojiCount.textContent = `${reaction.count}명`;

    detailUserList.innerHTML = '';
    reaction.users.forEach(u => {
      const chip = document.createElement('div');
      chip.className = 'user-chip';
      chip.innerHTML = `
        <img class="chip-avatar" src="${u.avatar || 'https://via.placeholder.com/32?text=?'}" alt="${getUserDisplayName(u)}">
        <span class="chip-name">${getUserDisplayName(u)}</span>
      `;
      detailUserList.appendChild(chip);
    });
  }

  /* ====================================================
     3. 피드백 리스트 CRUD 
     ==================================================== */

  addToFeedbackBtn.addEventListener('click', async () => {
    if (!currentAnalyzedMessage || !activeEmojiGroup) return;

    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageLink: slackUrlInput.value.trim(),
          messageText: currentAnalyzedMessage.text,
          emoji: activeEmojiGroup.name,
          users: activeEmojiGroup.users
        })
      });
      const data = await res.json();
      if (data.ok) {
        renderFeedbackList(data.feedbacks, true);
        goToSlide(2);

        const usersToSpawn = activeEmojiGroup.users.map(u => ({
          id: u.id,
          real_name: u.real_name,
          display_name: u.display_name || '',
          avatar: u.avatar
        }));
        
        spawnGroupOnField(usersToSpawn);

      } else {
        alert('피드백 소환 실패: ' + data.error);
      }
    } catch (e) {
      alert('서버 통신 에러');
    }
  });

  async function loadFeedbacks(skipSync = false) {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`);
      const data = await res.json();
      if (data.ok) {
        renderFeedbackList(data.feedbacks, skipSync);
      }
    } catch (e) {
      console.error('Failed to load feedbacks:', e);
    }
  }

  // 🔲 명단 일괄 전체 선택
  selectAllRunnersBtn.addEventListener('click', async () => {
    if (currentFeedbacksData.length === 0) return;
    if (!confirm('현재 경주 명단의 모든 사람들을 달리기에 참가(체크박스 켬)시키겠습니까?')) return;

    try {
      const promises = [];
      currentFeedbacksData.forEach(f => {
        f.users.forEach(u => {
          if (u.done) {
            promises.push(
              fetch(`${getApiBase()}/api/feedbacks/user`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageLink: f.messageLink, emoji: f.emoji, userId: u.id, done: false })
              })
            );
          }
        });
      });

      await Promise.all(promises);
      loadFeedbacks(false);
    } catch (e) {
      alert('일괄 전체 선택 처리 실패');
    }
  });

  // 🗑️ 명단 일괄 전체 삭제
  deleteAllRunnersBtn.addEventListener('click', async () => {
    if (currentFeedbacksData.length === 0) return;
    if (!confirm('초원의 모든 소환 명단을 삭제하고 초기화하시겠습니까? (캐릭터가 모두 추방됩니다)')) return;

    try {
      const promises = currentFeedbacksData.map(f =>
        fetch(`${getApiBase()}/api/feedbacks`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageLink: f.messageLink, emoji: f.emoji })
        })
      );

      await Promise.all(promises);
      
      for (let [uid, charState] of spawnedCharacters.entries()) {
        clearTimeout(charState.walkTimeout);
        clearInterval(charState.struggleInterval);
        
        const el = charState.element;
        el.classList.remove('spawn', 'waddling-walk', 'focused');
        el.classList.add('fade-out');
        
        spawnedCharacters.delete(uid);
        
        setTimeout(() => el.remove(), 700);
      }
      spawnedCharacters.clear();
      
      loadFeedbacks(true);
    } catch (e) {
      alert('일괄 전체 삭제 실패');
    }
  });

  function renderFeedbackList(feedbacks, skipSync = false) {
    currentFeedbacksData = feedbacks;
    feedbackListContainer.innerHTML = '';
    
    let totalPendingUsers = 0;
    const pendingUsers = [];

    if (feedbacks.length === 0) {
      feedbackListContainer.innerHTML = '<p class="empty-text">소환된 유저가 없습니다. 슬랙 메시지를 분석해 소환해보세요!</p>';
      if (!skipSync) syncMeadowCharacters([]);
      
      startRaceBtn.classList.add('hidden');
      gameModePanel.classList.add('hidden');
      return;
    }

    feedbacks.forEach(f => {
      const card = document.createElement('div');
      card.className = 'feedback-item-card';

      const header = document.createElement('div');
      header.className = 'feedback-item-header';

      const title = document.createElement('div');
      title.className = 'feedback-title';
      title.innerHTML = `${getEmojiDisplay(f.emoji)} <span>${f.emoji}</span>`;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete-card';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('이 피드백 그룹을 초원에서 추방하고 삭제하시겠습니까?')) {
          deleteFeedbackCard(f.messageLink, f.emoji);
        }
      });

      header.appendChild(title);
      header.appendChild(deleteBtn);
      card.appendChild(header);

      if (f.messageText) {
        const preview = document.createElement('div');
        preview.className = 'feedback-msg-preview';
        preview.textContent = f.messageText;
        card.appendChild(preview);
      }

      const userList = document.createElement('div');
      userList.className = 'feedback-users-list';

      f.users.forEach(u => {
        const userRow = document.createElement('div');
        userRow.className = `feedback-user-row ${u.done ? 'done' : ''}`;

        const displayName = getUserDisplayName(u);

        const topRow = document.createElement('div');
        topRow.className = 'user-row-top';
        topRow.innerHTML = `
          <div class="user-info-group">
            <img class="chip-avatar" src="${u.avatar || 'https://via.placeholder.com/32?text=?'}" alt="${displayName}">
            <span>${displayName}</span>
          </div>
        `;

        const rowActions = document.createElement('div');
        rowActions.className = 'user-row-actions';

        const checkWrap = document.createElement('label');
        checkWrap.className = 'checkbox-wrapper';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !u.done;
        
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          toggleUserFeedbackState(f.messageLink, f.emoji, u.id, !e.target.checked);
        });

        checkWrap.appendChild(checkbox);
        rowActions.appendChild(checkWrap);
        topRow.appendChild(rowActions);
        userRow.appendChild(topRow);

        const editArea = document.createElement('div');
        editArea.className = 'user-meta-edit';

        const fields = document.createElement('div');
        fields.className = 'meta-edit-fields';

        const memoInput = document.createElement('input');
        memoInput.type = 'text';
        memoInput.className = 'input-memo';
        memoInput.placeholder = '✏️ 피드백 메모 입력...';
        memoInput.value = u.memo || '';

        const linkInput = document.createElement('input');
        linkInput.type = 'url';
        linkInput.className = 'input-link';
        linkInput.placeholder = '🔗 참고 사이트 링크...';
        linkInput.value = u.link || '';

        const saveUserMetadata = async () => {
          const memoVal = memoInput.value.trim();
          const linkVal = linkInput.value.trim();
          
          try {
            await fetch(`${getApiBase()}/api/feedbacks/user/meta`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messageLink: f.messageLink,
                emoji: f.emoji,
                userId: u.id,
                memo: memoVal,
                link: linkVal
              })
            });
            u.memo = memoVal;
            u.link = linkVal;
          } catch (err) {
            console.error('메타데이터 임시저장 실패:', err);
          }
        };

        memoInput.addEventListener('change', saveUserMetadata);
        memoInput.addEventListener('blur', saveUserMetadata);
        linkInput.addEventListener('change', saveUserMetadata);
        linkInput.addEventListener('blur', saveUserMetadata);

        memoInput.addEventListener('click', (e) => e.stopPropagation());
        linkInput.addEventListener('click', (e) => e.stopPropagation());

        fields.appendChild(memoInput);
        fields.appendChild(linkInput);
        editArea.appendChild(fields);
        userRow.appendChild(editArea);

        userRow.addEventListener('click', (e) => {
          if (e.target.type === 'checkbox') return;
          if (u.done) return;

          const allRows = document.querySelectorAll('.feedback-user-row');
          const alreadyActive = userRow.classList.contains('active-edit');
          allRows.forEach(r => r.classList.remove('active-edit'));

          if (!alreadyActive) {
            userRow.classList.add('active-edit');
          }

          if (!spawnedCharacters.has(u.id)) {
            spawnMeadowCharacter(u);
          }
          focusCharacterOnField(u.id);
        });

        userList.appendChild(userRow);

        if (!u.done) {
          totalPendingUsers++;
          pendingUsers.push({
            id: u.id,
            real_name: u.real_name,
            display_name: u.display_name,
            avatar: u.avatar
          });
        }
      });

      card.appendChild(userList);
      feedbackListContainer.appendChild(card);
    });

    if (!skipSync) {
      syncMeadowCharacters(pendingUsers);
    }

    if (totalPendingUsers >= 2) {
      startRaceBtn.classList.remove('hidden');
      gameModePanel.classList.remove('hidden');
    } else {
      startRaceBtn.classList.add('hidden');
      gameModePanel.classList.add('hidden');
    }

    applyRealtimeGroupColors();
  }

  function spawnMeadowCharacter(u, idx = spawnedCharacters.size) {
    if (spawnedCharacters.has(u.id)) return;

    const charEl = document.createElement('div');
    charEl.className = 'meadow-character spawn';
    charEl.dataset.userId = u.id;
    
    const displayName = getUserDisplayName(u);
    
    const bubble = document.createElement('div');
    bubble.className = 'char-name-bubble';
    bubble.textContent = displayName;

    const body = document.createElement('div');
    body.className = 'char-body';
    body.style.backgroundImage = `url(${transparentImages.walk})`;

    charEl.appendChild(bubble);
    charEl.appendChild(body);

    characterContainer.appendChild(charEl);

    const charState = {
      element: charEl,
      bodyElement: body,
      isDragging: false,
      walkTimeout: null,
      struggleInterval: null,
      x: 0,
      y: 0,
      
      theta: 0,
      laneOffset: idx * 11,
      speed: 0.007,
      randomSeed: Math.random() * 10,
      
      // v20: 350px ~ 2350px 무작위 넘어짐 좌표 사전 배정 (낙오자용)
      fallX: 350 + Math.random() * 2000,
      
      isDead: false,
      isFinished: false 
    };

    spawnedCharacters.set(u.id, charState);

    arrangeAtStartLine(u.id, idx);
    bindDragAndDrop(u.id);
  }

  function arrangeAtStartLine(userId, idx) {
    const state = spawnedCharacters.get(userId);
    if (!state) return;

    // 🏃 경기장 레인 안에 밀집 출발 (세로 이탈 방지용 타이트 범위)
    const cols = 5; 
    const xCol = idx % cols;
    const yRow = Math.floor(idx / cols);

    state.x = 40 + xCol * 14 + Math.random() * 6;
    state.y = 12 + (yRow * 22) % 120; 

    state.element.style.transition = 'left 0.8s cubic-bezier(0.25, 1, 0.5, 1), bottom 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
    state.element.style.left = `${state.x}px`;
    state.element.style.bottom = `${state.y}px`;
    
    state.bodyElement.style.transform = 'scale(0.78)';
    state.element.style.zIndex = String(20 + Math.round(state.y));
    
    state.element.classList.remove('waddling-walk');
    state.bodyElement.style.backgroundImage = `url(${transparentImages.walk})`;

    state.isDead = false;
    state.isFinished = false;
    state.element.classList.remove('dead');
  }

  function spawnGroupOnField(userList) {
    userList.forEach((u, idx) => {
      spawnMeadowCharacter(u, idx);
    });
  }

  function focusCharacterOnField(userId) {
    const charState = spawnedCharacters.get(userId);
    if (!charState) return;

    bottomSheet.classList.remove('expanded');

    const el = charState.element;
    clearTimeout(charState.walkTimeout);
    el.classList.remove('waddling-walk');

    el.classList.add('focused');
    charState.bodyElement.style.backgroundImage = `url(${transparentImages.walk})`;

    setTimeout(() => {
      const state = spawnedCharacters.get(userId);
      if (state && !state.isDragging) {
        el.classList.remove('focused');
        if (!isRacing) {
          const idx = Array.from(spawnedCharacters.keys()).indexOf(userId);
          arrangeAtStartLine(userId, idx);
        }
      }
    }, 2500);
  }

  async function toggleUserFeedbackState(messageLink, emoji, userId, done) {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks/user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageLink, emoji, userId, done })
      });
      const data = await res.json();
      if (data.ok) {
        renderFeedbackList(data.feedbacks, true);
      }
    } catch (e) {
      alert('상태 변경 실패');
    }
  }

  async function deleteFeedbackCard(messageLink, emoji) {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageLink, emoji })
      });
      const data = await res.json();
      if (data.ok) {
        const deletedFeedback = data.feedbacks;
        renderFeedbackList(deletedFeedback, true);
        
        const activeIds = new Set();
        deletedFeedback.forEach(f => {
          f.users.forEach(u => {
            if (!u.done) activeIds.add(u.id);
          });
        });

        for (let [uid, charState] of spawnedCharacters.entries()) {
          if (!activeIds.has(uid)) {
            clearTimeout(charState.walkTimeout);
            clearInterval(charState.struggleInterval);
            const el = charState.element;
            el.classList.remove('spawn', 'waddling-walk', 'focused');
            el.classList.add('fade-out');
            spawnedCharacters.delete(uid);
            setTimeout(() => el.remove(), 700);
          }
        }
      }
    } catch (e) {
      alert('피드백 삭제 실패');
    }
  }

  /* ====================================================
     5. 🏁 v20: 2D 초장거리 마라톤(3200px) 및 넘어짐 탈락 물리
     ==================================================== */

  startRaceBtn.addEventListener('click', () => {
    if (isRacing) return;
    sfx.init();
    
    eliminatedQueue = [];

    const activeRunners = [];
    let idx = 0;
    for (let [uid, state] of spawnedCharacters.entries()) {
      state.isDead = false;
      state.isFinished = false;
      
      state.element.classList.remove('dead', 'focused');
      state.bodyElement.style.backgroundImage = `url(${transparentImages.run})`;
      
      clearTimeout(state.walkTimeout);
      state.element.classList.remove('waddling-walk');
      
      arrangeAtStartLine(uid, idx);
      state.element.classList.add('racing');
      activeRunners.push(uid);
      idx++;
    }

    if (activeRunners.length < 2) {
      alert('최소 2명 이상의 캐릭터가 대기 중이어야 경주가 시작됩니다.');
      return;
    }

    totalRunnersCount = activeRunners.length;
    currentZoom = 1.1;

    if (selectedGameMode === 'podium') {
      const N = Math.min(parseInt(winnerCountInput.value) || 1, activeRunners.length - 1);
      const shuffled = [...activeRunners].sort(() => Math.random() - 0.5);
      selectedWinnersList = shuffled.slice(0, N);
      generatedGroupsList = [];
    } else {
      const M = parseInt(teamCountInput.value) || 2;
      selectedWinnersList = [];
      generatedGroupsList = Array.from({ length: M }, () => []);
      
      const shuffled = [...activeRunners].sort(() => Math.random() - 0.5);
      shuffled.forEach((uid, index) => {
        const groupIdx = index % M;
        
        let userObj = null;
        for (let f of currentFeedbacksData) {
          const matchUser = f.users.find(u => u.id === uid && !u.done);
          if (matchUser) {
            userObj = matchUser;
            break;
          }
        }

        generatedGroupsList[groupIdx].push({
          id: uid,
          real_name: userObj ? userObj.real_name : uid,
          display_name: userObj ? userObj.display_name : '',
          avatar: userObj ? userObj.avatar : 'https://via.placeholder.com/32'
        });

        const charState = spawnedCharacters.get(uid);
        if (charState) {
          charState.element.className = `meadow-character team-${groupIdx} racing`;
        }
      });
    }

    bottomSheet.classList.remove('expanded');
    runRaceCountdown(activeRunners);
  });

  function runRaceCountdown(activeRunners) {
    raceCountdown.classList.remove('hidden');
    raceCommentary.classList.remove('hidden');
    
    const numEl = raceCountdown.querySelector('.countdown-num');
    
    let count = 3;
    numEl.textContent = count;
    
    if (selectedGameMode === 'podium') {
      const N = Math.min(parseInt(winnerCountInput.value) || 1, activeRunners.length - 1);
      commentaryText.textContent = `[중계] 🏆 선착순 모드! 최후의 ${N}명이 피드백 당첨자가 됩니다!`;
    } else {
      const M = parseInt(teamCountInput.value) || 2;
      commentaryText.textContent = `[중계] 👥 조 짜기 모드! 총 ${M}개조로 나뉘어 단체전 우호 질주가 펼쳐집니다!`;
    }
    
    sfx.playBeep(600, 0.1);

    const timer = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.textContent = count;
        sfx.playBeep(600, 0.1);
      } else if (count === 0) {
        numEl.textContent = 'START!';
        sfx.playShot();
      } else {
        clearInterval(timer);
        raceCountdown.classList.add('hidden');
        startStadiumRace();
      }
    }, 1000);
  }

  btnSkipRace.addEventListener('click', () => {
    if (!isRacing) return;
    isRacing = false;
    cancelAnimationFrame(raceAnimationFrameId);
    finishRace();
  });

  function startStadiumRace() {
    isRacing = true;

    const FINISH_X = 2500;
    const RACE_LIMIT_MS = 15000;
    // 거리 ~2450px → 초당 360~520px면 약 5~7초에 선두 골인
    const raceStartTime = performance.now();
    let lastFrameTime = raceStartTime;

    // 사람마다 확연히 다른 고유 속도 (셔플 랭크)
    const runners = Array.from(spawnedCharacters.keys());
    const speedRanks = runners
      .map((_, i) => i)
      .sort(() => Math.random() - 0.5);

    runners.forEach((uid, i) => {
      const state = spawnedCharacters.get(uid);
      const rank = speedRanks[i]; // 0 = 느림 … n-1 = 빠름
      const t = runners.length <= 1 ? 1 : rank / (runners.length - 1);
      // 기본 340~500 px/s + 개인 노이즈
      let base = 340 + t * 160 + Math.random() * 35;

      // 선착순 당첨 후보에게 소폭 가속 (그래도 순위 경쟁은 유지)
      if (selectedGameMode === 'podium' && selectedWinnersList.includes(uid)) {
        base += 40 + Math.random() * 30;
      }

      state.speed = base;
      state.speedJitter = 0.55 + Math.random() * 0.9; // 개인별 출렁임 주기/폭
      state.fallX = 500 + Math.random() * 1600;
      // Y 재클램프 — 목업 밖으로 안 나가게
      state.y = Math.max(8, Math.min(125, state.y));
    });

    camX = 0;
    camY = 0;
    currentZoom = 1.0;

    let frameIndex = 0;
    let lastCommentTime = 0;
    let leaderUid = null;

    function updateRaceFrame(now) {
      if (!isRacing) return;
      frameIndex++;

      const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
      lastFrameTime = now;
      const elapsed = now - raceStartTime;

      if (elapsed >= RACE_LIMIT_MS) {
        isRacing = false;
        cancelAnimationFrame(raceAnimationFrameId);
        finishRace();
        return;
      }

      let activeRunnersCount = 0;
      spawnedCharacters.forEach((st) => {
        if (!st.isDead && !st.isFinished) activeRunnersCount++;
      });

      if (activeRunnersCount === 0) {
        isRacing = false;
        cancelAnimationFrame(raceAnimationFrameId);
        finishRace();
        return;
      }

      const aliveRunners = [];
      spawnedCharacters.forEach((st, uid) => {
        if (!st.isDead) aliveRunners.push({ id: uid, state: st });
      });

      // 현재 1등
      let leader = aliveRunners[0];
      aliveRunners.forEach(r => {
        if (r.state.x > leader.state.x) leader = r;
      });
      leaderUid = leader.id;
      const leadX = leader.state.x;

      if (frameIndex - lastCommentTime >= 50) {
        lastCommentTime = frameIndex;
        if (aliveRunners.length > 1) {
          const opts = selectedGameMode === 'podium'
            ? [
                `[중계] 🏆 남은 생존 주자 ${aliveRunners.length}명!`,
                `[중계] 카메라가 1등을 바짝 추적합니다!`,
                `[중계] 피니시 아치를 향해 전력 질주!`
              ]
            : [
                `[중계] 👥 선두를 카메라가 따라갑니다!`,
                `[중계] 조별 대형으로 질주 중!`,
                `[중계] 단체 골인을 향한 힘찬 전진!`
              ];
          commentaryText.textContent = opts[Math.floor(Math.random() * opts.length)];
        }
      }

      // 💥 낙오 — 즉시 화면에서 제거 (시체는 안 보여줌)
      const justEliminated = [];
      spawnedCharacters.forEach((state, uid) => {
        if (state.isDead || state.isFinished) return;
        if (selectedGameMode !== 'podium') return;
        if (selectedWinnersList.includes(uid)) return;
        if (state.x < state.fallX) return;

        state.isDead = true;
        eliminatedQueue.push(uid);
        justEliminated.push(uid);
        const charName = state.element.querySelector('.char-name-bubble').textContent;
        commentaryText.textContent = `[중계] 💥 앗! ${charName} 선수, 돌부리에 발이 걸려 넘어졌습니다!`;
        sfx.playSplat();
      });
      justEliminated.forEach(uid => {
        const state = spawnedCharacters.get(uid);
        if (!state) return;
        state.element.remove();
        spawnedCharacters.delete(uid);
      });

      // 이동 — 카메라에는 1등만 보이게 (나머지 생존자도 숨김)
      spawnedCharacters.forEach((state, uid) => {
        if (state.isDead) return;

        if (state.x >= FINISH_X) {
          if (!state.isFinished) {
            state.isFinished = true;
            state.x = FINISH_X;
            const charName = getUserDisplayName({
              display_name: state.element.querySelector('.char-name-bubble').textContent
            });
            state.element.querySelector('.char-name-bubble').innerHTML = `🏁 ${charName}`;
            commentaryText.textContent = `[중계] 🎉 ${charName} 선수, 피니시 아치 골인!`;
          }
          state.element.style.left = `${state.x - 30}px`;
          state.element.style.bottom = `${state.y}px`;
          state.element.style.opacity = uid === leaderUid ? '1' : '0';
          return;
        }

        const jitter = Math.sin(frameIndex * 0.11 * state.speedJitter + state.randomSeed) * (18 + state.speedJitter * 22);
        state.x += (state.speed + jitter) * dt;

        state.y = Math.max(8, Math.min(125, state.y));
        state.bodyElement.classList.remove('facing-left');

        const scale = 0.72 + (state.y / 260) * 0.14;
        state.element.style.left = `${state.x - 30}px`;
        state.element.style.bottom = `${state.y}px`;
        state.bodyElement.style.transform = `scale(${scale})`;
        state.element.style.zIndex = String(20 + Math.round(state.y));
        // 1등만 표시
        state.element.style.opacity = uid === leaderUid ? '1' : '0';
        state.element.classList.toggle('race-leader', uid === leaderUid);
      });

      // 🎥 1등만 화면 정중앙 하드 락
      const mockupW = document.querySelector('.mobile-mockup')?.clientWidth || 390;
      const viewCenter = mockupW / 2;
      camX = viewCenter - leadX;
      currentZoom = 1;

      cameraStage.style.transformOrigin = `${leadX}px 42%`;
      cameraStage.style.transform = `translateX(${camX}px)`;

      parallaxTrees.forEach((tree, tIdx) => {
        tree.style.transform = `translateX(${tIdx * 105 + camX * 0.35}px)`;
      });

      raceAnimationFrameId = requestAnimationFrame(updateRaceFrame);
    }

    raceAnimationFrameId = requestAnimationFrame(updateRaceFrame);
  }

  function finishRace() {
    cameraStage.style.transform = 'translate(0px, 0px) scale(1)';
    sfx.playWoohoo();

    bottomSheet.classList.add('expanded');
    goToSlide(3);

    if (selectedGameMode === 'podium') {
      rankingListView.classList.remove('hidden');
      groupRankingView.classList.add('hidden');

      const aliveRunners = [];
      spawnedCharacters.forEach((state, uid) => {
        if (!state.isDead) {
          aliveRunners.push({ uid, x: state.x });
        }
      });
      aliveRunners.sort((a, b) => b.x - a.x);

      aliveRunners.forEach(r => {
        const charState = spawnedCharacters.get(r.uid);
        if (charState) {
          charState.element.classList.remove('racing');
          charState.element.classList.add('focused');
          charState.element.style.opacity = '1';
          charState.bodyElement.style.backgroundImage = `url(${transparentImages.walk})`;
          charState.bodyElement.style.transform = 'scale(1.18)';
          charState.element.style.left = '2490px'; // 2500 지점 안착
          charState.element.style.bottom = `${charState.y}px`;
          charState.element.style.zIndex = '125';
        }
      });

      const sortedEliminated = [...eliminatedQueue].reverse();
      const finalRankingList = [
        ...aliveRunners.map(r => r.uid),
        ...sortedEliminated
      ];

      rankingListView.innerHTML = '';
      
      finalRankingList.forEach((uid, index) => {
        const rank = index + 1;
        
        let userObj = null;
        for (let f of currentFeedbacksData) {
          const matchUser = f.users.find(u => u.id === uid);
          if (matchUser) {
            userObj = matchUser;
            break;
          }
        }

        const uName = userObj ? getUserDisplayName(userObj) : uid;
        const uAvatar = userObj ? userObj.avatar : 'https://via.placeholder.com/32';

        const isWinner = rank <= selectedWinnersList.length;

        const item = document.createElement('div');
        item.className = `rank-item ${isWinner ? 'winner' : 'loser'}`;
        
        item.innerHTML = `
          <span class="rank-badge">${isWinner ? `👑 ${rank}위` : `${rank}위`}</span>
          <img src="${uAvatar}" alt="Avatar">
          <span class="rank-name">${uName}</span>
        `;
        rankingListView.appendChild(item);
      });

      commentaryText.textContent = `[중계] 🎉 경기 종료! 최종 순위표가 발표되었습니다.`;

    } else {
      rankingListView.classList.add('hidden');
      groupRankingView.classList.remove('hidden');

      spawnedCharacters.forEach(state => {
        state.element.classList.remove('racing');
        state.element.classList.add('focused');
        state.element.style.opacity = '1';
        state.bodyElement.style.backgroundImage = `url(${transparentImages.walk})`;
        state.element.style.left = '2490px';
        state.element.style.zIndex = '125';
      });

      groupRankingView.innerHTML = '';
      const teamIcons = ['🔵', '🔴', '🟡', '🟢'];
      const teamNames = ['블루조 (1조)', '핑크조 (2조)', '골드조 (3조)', '그린조 (4조)'];

      generatedGroupsList.forEach((group, gIdx) => {
        if (group.length === 0) return; 

        const card = document.createElement('div');
        card.className = 'group-result-card';

        const title = document.createElement('div');
        title.className = 'group-card-title';
        title.innerHTML = `<span>${teamIcons[gIdx] || '👥'}</span> <span>${teamNames[gIdx] || `${gIdx+1}조`}</span>`;
        card.appendChild(title);

        const list = document.createElement('div');
        list.className = 'group-members-list';

        group.forEach(m => {
          const item = document.createElement('div');
          item.className = 'group-member-item';
          const dName = getUserDisplayName(m);
          item.innerHTML = `
            <img class="group-member-avatar" src="${m.avatar}" alt="Avatar">
            <span>${dName}</span>
          `;
          list.appendChild(item);
        });

        card.appendChild(list);
        groupRankingView.appendChild(card);
      });

      commentaryText.textContent = `[중계] 🎉 무작위 조 조성이 완료되었습니다!`;
    }
  }

  rankingConfirmBtn.addEventListener('click', async () => {
    raceCommentary.classList.add('hidden');

    if (selectedGameMode === 'podium') {
      const promises = [];
      selectedWinnersList.forEach(uid => {
        for (let f of currentFeedbacksData) {
          const matchUser = f.users.find(u => u.id === uid && !u.done);
          if (matchUser) {
            promises.push(
              toggleUserFeedbackState(f.messageLink, f.emoji, uid, true)
            );
            break;
          }
        }
      });

      await Promise.all(promises);
    }

    goToSlide(2);
    resetMeadowToPatrol();
  });

  function resetMeadowToPatrol() {
    isRacing = false;
    cancelAnimationFrame(raceAnimationFrameId);

    cameraStage.style.transform = 'translate(0px, 0px) scale(1)';

    let idx = 0;
    spawnedCharacters.forEach((state, uid) => {
      state.element.classList.remove('racing', 'focused', 'dead', 'race-leader');
      state.element.style.opacity = '1';
      state.bodyElement.style.transform = 'none';
      state.element.style.zIndex = '125';
      arrangeAtStartLine(uid, idx);
      idx++;
    });

    loadFeedbacks(false);
  }

  /* ====================================================
     6. 🍀 캐릭터 스폰 앤 싱크
     ==================================================== */

  function syncMeadowCharacters(pendingUsers) {
    const pendingIds = new Set(pendingUsers.map(u => u.id));
    
    for (let [uid, charState] of spawnedCharacters.entries()) {
      if (!pendingIds.has(uid)) {
        clearTimeout(charState.walkTimeout);
        clearInterval(charState.struggleInterval);
        
        const el = charState.element;
        el.classList.remove('spawn', 'waddling-walk', 'focused');
        el.classList.add('fade-out');
        
        spawnedCharacters.delete(uid);
        
        setTimeout(() => {
          el.remove();
        }, 700);
      }
    }

    pendingUsers.forEach((u, idx) => {
      if (!spawnedCharacters.has(u.id)) {
        spawnowCharacter(u, idx);
      }
    });
  }

  const spawnowCharacter = spawnMeadowCharacter;

  function startPatrol(userId) {
    const charState = spawnedCharacters.get(userId);
    if (!charState || charState.isDragging || charState.element.classList.contains('focused') || isRacing) return;

    const idx = Array.from(spawnedCharacters.keys()).indexOf(userId);
    arrangeAtStartLine(userId, idx);
  }

  function bindDragAndDrop(userId) {
    const charState = spawnedCharacters.get(userId);
    if (!charState) return;

    const el = charState.element;
    let startMouseX = 0, startMouseY = 0;
    let startCharLeft = 0, startCharBottom = 0;

    el.addEventListener('mousedown', (e) => {
      if (isRacing) return;

      if (el.classList.contains('focused')) {
        el.classList.remove('focused');
      }

      charState.isDragging = true;
      
      clearTimeout(charState.walkTimeout);
      el.classList.remove('waddling-walk');

      el.classList.add('dragging', 'wiggling');

      let toggle = false;
      charState.bodyElement.style.backgroundImage = `url(${transparentImages.struggle1})`;
      
      charState.struggleInterval = setInterval(() => {
        toggle = !toggle;
        charState.bodyElement.style.backgroundImage = `url(${
          toggle ? transparentImages.struggle2 : transparentImages.struggle1
        })`;
      }, 150);

      startMouseX = e.clientX;
      startMouseY = e.clientY;

      startCharLeft = parseFloat(el.style.left) || 0;
      startCharBottom = parseFloat(el.style.bottom) || 0;

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      e.preventDefault();
    });

    function onMouseMove(e) {
      if (!charState.isDragging) return;

      const deltaX = e.clientX - startMouseX;
      const deltaY = startMouseY - e.clientY;

      let newLeft = startCharLeft + deltaX;
      let newBottom = startCharBottom + deltaY;

      if (newLeft < -100) newLeft = -100;
      if (newLeft > 2460) newLeft = 2460;
      
      if (newBottom < -100) newBottom = -100;
      if (newBottom > 660) newBottom = 660;

      el.style.left = `${newLeft}px`;
      el.style.bottom = `${newBottom}px`;

      charState.x = newLeft;
      charState.y = newBottom;
    }

    function onMouseUp() {
      if (!charState.isDragging) return;
      charState.isDragging = false;

      el.classList.remove('dragging', 'wiggling');
      clearInterval(charState.struggleInterval);

      charState.bodyElement.style.backgroundImage = `url(${transparentImages.walk})`;

      const idx = Array.from(spawnedCharacters.keys()).indexOf(userId);
      arrangeAtStartLine(userId, idx);

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
  }
});
