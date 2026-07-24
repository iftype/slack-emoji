// Slack Meadow - Complete React 18 Application Component (Explicit Paste & Clear Button v68.0.0)

const { useState, useEffect, useRef } = React;

// 1. Emoji & Shortcode Helper Module
const EMOJI_MAP = {
  'one': '1️⃣', 'two': '2️⃣', 'three': '3️⃣', 'four': '4️⃣', 'five': '5️⃣',
  'six': '6️⃣', 'seven': '7️⃣', 'eight': '8️⃣', 'nine': '9️⃣', 'zero': '0️⃣',
  'keycap_ten': '🔟', '+1': '👍', '-1': '👎', 'thumbsup': '👍', 'thumbsdown': '👎',
  'heart': '❤️', 'tada': '🎉', 'fire': '🔥', 'smile': '😄', 'check': '✅',
  'raising_hand': '🙋', 'eyes': '👀', 'rocket': '🚀', '100': '💯',
  'clap': '👏', 'pray': '🙏', 'party_blob': '🥳', 'blob_cheer': '🎉', 'zzang': '👍'
};

function renderEmojiIcon(name, customCache = {}) {
  if (!name) return '😃';
  const cleanName = name.replace(/^:+|:+$/g, '').trim().toLowerCase();
  if (!cleanName) return '😃';

  if (customCache[cleanName]) {
    return `<img src="${customCache[cleanName]}" alt=":${cleanName}:" class="custom-emoji-img" style="width:20px;height:20px;vertical-align:middle;border-radius:4px;display:inline-block;" onerror="this.style.display='none';">`;
  }
  if (EMOJI_MAP[cleanName]) return EMOJI_MAP[cleanName];
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(name)) return name;

  return `<span class="custom-emoji-pill" style="background:#e0e7ff;color:#4338ca;padding:2px 6px;border-radius:6px;font-size:11px;font-weight:700;display:inline-block;vertical-align:middle;line-height:1.2;">:${cleanName}:</span>`;
}

function parseTextEmojis(text, customCache = {}) {
  if (!text) return '';
  let parsed = text;
  Object.keys(customCache).forEach(name => {
    const cleanName = name.replace(/^:+|:+$/g, '').toLowerCase();
    const regex = new RegExp(`:${cleanName}:`, 'gi');
    parsed = parsed.replace(regex, `<img src="${customCache[name]}" alt=":${cleanName}:" class="custom-emoji-img" style="width:20px;height:20px;vertical-align:middle;border-radius:4px;display:inline-block;">`);
  });
  Object.keys(EMOJI_MAP).forEach(name => {
    const regex = new RegExp(`:${name}:`, 'gi');
    parsed = parsed.replace(regex, EMOJI_MAP[name]);
  });
  return parsed;
}

// 🛡️ 아바타 이미지 깨짐 방지 헬퍼
const DEFAULT_AVATAR_BG = ['10b981', '6366f1', 'ec4899', 'f59e0b', '3b82f6', '8b5cf6', '14b8a6'];

function getAvatarUrl(u) {
  if (u && u.avatar && u.avatar.trim() && !u.avatar.includes('T000-U00') && !u.avatar.includes('via.placeholder')) {
    return u.avatar;
  }
  const name = getUserDisplayName(u);
  const initial = encodeURIComponent(name.charAt(0) || '👤');
  const bg = DEFAULT_AVATAR_BG[Math.abs(name.charCodeAt(0) || 0) % DEFAULT_AVATAR_BG.length];
  return `https://ui-avatars.com/api/?name=${initial}&background=${bg}&color=ffffff&bold=true&size=128`;
}

function handleImgError(e, name = 'User') {
  e.target.onerror = null;
  const initial = encodeURIComponent((name || 'U').charAt(0));
  const bg = DEFAULT_AVATAR_BG[Math.abs(name.charCodeAt(0) || 0) % DEFAULT_AVATAR_BG.length];
  e.target.src = `https://ui-avatars.com/api/?name=${initial}&background=${bg}&color=ffffff&bold=true&size=128`;
}

// 🛡️ 샘플 백업 사용자
const FALLBACK_USERS = [
  { id: 'usr_1', name: '재키(최재영)', real_name: '재키(최재영)', display_name: '재키(최재영)', avatar: 'https://ui-avatars.com/api/?name=재키&background=10b981&color=fff&bold=true' },
  { id: 'usr_2', name: '와이제리(최용준)', real_name: '와이제리(최용준)', display_name: '와이제리(최용준)', avatar: 'https://ui-avatars.com/api/?name=와이제리&background=6366f1&color=fff&bold=true' },
  { id: 'usr_3', name: '바니(임혜정)', real_name: '바니(임혜정)', display_name: '바니(임혜정)', avatar: 'https://ui-avatars.com/api/?name=바니&background=ec4899&color=fff&bold=true' },
  { id: 'usr_4', name: '호이(조상준)', real_name: '호이(조상준)', display_name: '호이(조상준)', avatar: 'https://ui-avatars.com/api/?name=호이&background=f59e0b&color=fff&bold=true' },
  { id: 'usr_5', name: '정콩이(유정빈)', real_name: '정콩이(유정빈)', display_name: '정콩이(유정빈)', avatar: 'https://ui-avatars.com/api/?name=정콩이&background=3b82f6&color=fff&bold=true' },
  { id: 'usr_6', name: '이스타', real_name: '이스타', display_name: '이스타', avatar: 'https://ui-avatars.com/api/?name=이스타&background=8b5cf6&color=fff&bold=true' },
  { id: 'usr_7', name: '정찬', real_name: '정찬', display_name: '정찬', avatar: 'https://ui-avatars.com/api/?name=정찬&background=14b8a6&color=fff&bold=true' }
];

function normalizeUser(u) {
  if (!u) return { id: 'unknown_' + Math.random(), name: '사용자', real_name: '사용자' };
  if (typeof u === 'string') return { id: u, name: u, real_name: u, display_name: u };
  return {
    id: u.id || u.name || ('usr_' + Math.random()),
    name: u.name || u.id || '사용자',
    real_name: u.real_name || u.name || '사용자',
    display_name: u.display_name || u.real_name || u.name || '사용자',
    avatar: u.avatar || '',
    done: !!u.done
  };
}

function getUserDisplayName(u) {
  if (!u) return '사용자';
  if (typeof u === 'string') return u;
  return u.display_name || u.real_name || u.name || '사용자';
}

function shuffleArray(arr) {
  if (!arr || !Array.isArray(arr)) return [];
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 🎯 당첨자 인접 슬롯 동일인물 중복 원천 차단 릴 생성기
function buildCleanReelList(runners, winner, targetIndex = 18) {
  if (!runners || runners.length === 0) return [];
  
  const normWinner = normalizeUser(winner);
  const winnerName = getUserDisplayName(normWinner);
  const winnerId = normWinner.id;

  const runnerMap = new Map();
  runners.forEach(u => {
    const norm = normalizeUser(u);
    const name = getUserDisplayName(norm);
    if (norm.id && !runnerMap.has(norm.id)) {
      runnerMap.set(norm.id, { ...norm, displayName: name });
    }
  });
  const uniqueRunners = Array.from(runnerMap.values());
  const totalCards = 30;
  const reel = new Array(totalCards);

  reel[targetIndex] = { ...normWinner, done: false, isTarget: true, displayName: winnerName };

  let pool = shuffleArray([...uniqueRunners]);

  for (let i = 0; i < totalCards; i++) {
    if (i === targetIndex) continue;

    if (pool.length === 0) {
      pool = shuffleArray([...uniqueRunners]);
    }

    let candidateIdx = pool.findIndex(u => {
      const recent = [];
      if (i > 0 && reel[i - 1]) recent.push(reel[i - 1]);
      if (i > 1 && reel[i - 2]) recent.push(reel[i - 2]);
      if (i > 2 && reel[i - 3]) recent.push(reel[i - 3]);

      if (recent.some(r => r.id === u.id || r.displayName === u.displayName)) return false;

      if (Math.abs(i - targetIndex) <= 2) {
        if (u.id === winnerId || u.displayName === winnerName) return false;
      }

      return true;
    });

    if (candidateIdx === -1) {
      candidateIdx = pool.findIndex(u => {
        const prevCard = (i > 0 && reel[i - 1]) ? reel[i - 1] : null;
        if (prevCard && (prevCard.id === u.id || prevCard.displayName === u.displayName)) return false;
        if (Math.abs(i - targetIndex) <= 1 && (u.id === winnerId || u.displayName === winnerName)) return false;
        return true;
      });
    }

    if (candidateIdx === -1) candidateIdx = 0;

    const picked = pool.splice(candidateIdx, 1)[0];
    reel[i] = { ...picked };
  }

  return reel;
}

// 2. API Communication Service
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : 'https://iftype.store/slack';

const SlackApi = {
  async fetchCustomEmojis() {
    try {
      const res = await fetch(`${API_BASE}/api/emojis`);
      const data = await res.json();
      return (data.ok && (data.emojis || data.emoji)) ? (data.emojis || data.emoji) : {};
    } catch (e) {
      return {};
    }
  },

  async analyzeSlackUrl(url) {
    const res = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || '슬랙 메시지를 가져올 수 없습니다.');
    return data;
  }
};

// 3. Main React Application Component
function App() {
  // Input & Message State
  const [slackUrl, setSlackUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [analyzedMsg, setAnalyzedMsg] = useState(null);
  const [customEmojis, setCustomEmojis] = useState({});
  const [unreactedUsers, setUnreactedUsers] = useState([]);
  
  // UI Tabs & Toggles
  const [activeTab, setActiveTab] = useState('emojis'); // 'emojis' | 'unreacted'
  const [activeEmojiGroup, setActiveEmojiGroup] = useState(null);
  const [showUserAnalysis, setShowUserAnalysis] = useState(false);

  // Feedbacks & Draw State
  const [feedbacks, setFeedbacks] = useState([]);
  const [pickedWinners, setPickedWinners] = useState([]);
  const [groupTeams, setGroupTeams] = useState(null);

  // Game Mode & Stepper (조 짜기 전용)
  const [gameMode, setGameMode] = useState('podium'); // 'podium' | 'group'
  const [teamCount, setTeamCount] = useState(2);

  // Sheet Navigation & Animation
  const [currentSlide, setCurrentSlide] = useState(0); // 0: Input, 1: Config/Runners, 2: Result
  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);

  // Roulette Engine State
  const [isRolling, setIsRolling] = useState(false);
  const [commentaryText, setCommentaryText] = useState('');
  const [showCommentary, setShowCommentary] = useState(false);
  
  const [reelCards, setReelCards] = useState([]);
  const [reelY, setReelY] = useState(0);
  const [transitionStyle, setTransitionStyle] = useState('none');
  const lastTargetYRef = useRef(0);

  const slide2Ref = useRef(null);
  const rankingScrollRef = useRef(null);

  // 🍀 접속 시 서버 커스텀 이모지 로드
  useEffect(() => {
    SlackApi.fetchCustomEmojis().then(emojis => {
      if (emojis && Object.keys(emojis).length > 0) {
        setCustomEmojis(prev => ({ ...prev, ...emojis }));
      }
    });
    setReelCards([]);
  }, []);

  // Compute All Runners
  const getAllRunners = (sourceFeedbacks = null) => {
    const target = sourceFeedbacks || feedbacks;
    const runnerMap = new Map();
    target.forEach(f => {
      if (f && Array.isArray(f.users)) {
        f.users.forEach(rawU => {
          const u = normalizeUser(rawU);
          if (u.id && !runnerMap.has(u.id)) runnerMap.set(u.id, u);
        });
      }
    });
    return Array.from(runnerMap.values());
  };

  // 🎯 이미 당첨된 사람(ID & 이름)을 100% 제외하는 미당첨자 추출기
  const getUniqueActiveRunners = (sourceFeedbacks = null) => {
    const target = sourceFeedbacks || feedbacks;
    const pickedIds = new Set(pickedWinners.map(w => w.id));
    const pickedNames = new Set(pickedWinners.map(getUserDisplayName));

    const runnerMap = new Map();
    target.forEach(f => {
      if (f && Array.isArray(f.users)) {
        f.users.forEach(rawU => {
          const u = normalizeUser(rawU);
          const displayName = getUserDisplayName(u);
          if (
            u.id &&
            !u.done &&
            !pickedIds.has(u.id) &&
            !pickedNames.has(displayName) &&
            !runnerMap.has(u.id)
          ) {
            runnerMap.set(u.id, u);
          }
        });
      }
    });
    return Array.from(runnerMap.values());
  };

  // 🎯 사람(유저) 기준 이모지 반응 집계
  const getUserCentricAnalysis = () => {
    if (!analyzedMsg || !analyzedMsg.reactions) return [];
    const userMap = new Map();
    analyzedMsg.reactions.forEach(r => {
      (r.users || []).forEach(rawU => {
        const u = normalizeUser(rawU);
        const name = getUserDisplayName(u);
        if (!userMap.has(name)) {
          userMap.set(name, { user: u, name: name, emojis: [] });
        }
        if (!userMap.get(name).emojis.includes(r.name)) {
          userMap.get(name).emojis.push(r.name);
        }
      });
    });
    return Array.from(userMap.values());
  };

  // Preview Reel Update
  useEffect(() => {
    if (!isRolling && pickedWinners.length === 0) {
      const activeRunners = getUniqueActiveRunners();
      if (activeRunners.length === 0) {
        setReelCards([]);
      } else {
        let cyclic = [];
        for (let i = 0; i < 6; i++) {
          const shuffledSet = shuffleArray(activeRunners);
          shuffledSet.forEach(u => {
            if (cyclic.length === 0 || cyclic[cyclic.length - 1].id !== u.id) {
              cyclic.push(u);
            }
          });
        }
        setReelCards(cyclic);
      }
      setReelY(0);
      setTransitionStyle('none');
      lastTargetYRef.current = 0;
    }
  }, [feedbacks, isRolling, pickedWinners.length]);

  // 🎯 모바일/데스크톱 100% 호환 클립보드 붙여넣기 & 지우기 버튼 핸들러
  const handlePasteOrClear = async () => {
    if (slackUrl) {
      setSlackUrl('');
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
          if (match && match[0]) {
            setSlackUrl(match[0]);
          } else {
            setSlackUrl(text);
          }
        } else {
          alert('클립보드에 복사된 내용이 없습니다.');
        }
      } else {
        alert('클립보드 읽기 기능이 지원되지 않는 브라우저입니다. 직접 붙여넣어 주세요.');
      }
    } catch (e) {
      alert('클립보드 읽기 권한이 허용되지 않았습니다. 직접 붙여넣기 해주세요.');
    }
  };

  // Form Submission
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!slackUrl.trim()) return;
    setLoading(true);
    setStatusMsg('');

    try {
      const resData = await SlackApi.analyzeSlackUrl(slackUrl.trim());
      const msg = resData.message;
      setAnalyzedMsg(msg);
      setUnreactedUsers((msg.unreactedUsers || []).map(normalizeUser));
      
      if (resData.customEmojis || msg.customEmojis) {
        setCustomEmojis(prev => ({ ...prev, ...(resData.customEmojis || msg.customEmojis || {}) }));
      }

      if (msg.reactions && msg.reactions.length > 0) {
        setActiveEmojiGroup(msg.reactions[0]);
      }
    } catch (err) {
      setStatusMsg(err.message);
      const fallbackMsg = {
        user: FALLBACK_USERS[0],
        ts: Date.now() / 1000,
        text: '슬랙 메시지 분석 완료 (샘플 데이터)',
        reactions: [
          { name: 'check', count: 5, users: FALLBACK_USERS.slice(0, 5) },
          { name: 'tada', count: 3, users: FALLBACK_USERS.slice(2, 5) },
          { name: 'fire', count: 2, users: FALLBACK_USERS.slice(0, 2) }
        ]
      };
      setAnalyzedMsg(fallbackMsg);
      setActiveEmojiGroup(fallbackMsg.reactions[0]);
    } finally {
      setLoading(false);
    }
  };

  // 특정 이모지 반응자 명단 복사
  const handleCopyEmojiUsers = (emojiGroup) => {
    if (!emojiGroup || !emojiGroup.users || emojiGroup.users.length === 0) return;
    const names = emojiGroup.users.map((u, i) => `${i + 1}. ${getUserDisplayName(u)}`).join('\n');
    const text = `:[${emojiGroup.name}]: 이모지 반응자 (${emojiGroup.users.length}명 - 누른 순서)\n${names}`;
    navigator.clipboard.writeText(text);
    alert(`:${emojiGroup.name}: 이모지 반응자 ${emojiGroup.users.length}명의 명단(누른 순서)이 복사되었습니다!`);
  };

  // 사람 기준 이모지 현황 전체 복사
  const handleCopyPersonCentricAnalysis = () => {
    const userAnalysis = getUserCentricAnalysis();
    if (userAnalysis.length === 0) return;
    const lines = userAnalysis.map((item, i) => {
      const emojiStr = item.emojis.map(e => `:${e}:`).join(' ');
      return `${i + 1}. ${item.name} : ${emojiStr}`;
    });
    const resultText = `[슬랙 이모지 반응 참여 유저 현황 (총 ${userAnalysis.length}명)]\n` + lines.join('\n');
    navigator.clipboard.writeText(resultText);
    alert(`총 ${userAnalysis.length}명의 사람 기준 이모지 반응 현황이 복사되었습니다!`);
  };

  // 사람 기준 참여 유저 이름만 복사
  const handleCopyUserNamesSpaced = () => {
    const userAnalysis = getUserCentricAnalysis();
    if (userAnalysis.length === 0) return;
    const names = userAnalysis.map(item => item.name).join(' ');
    navigator.clipboard.writeText(names);
    alert(`참여 유저 ${userAnalysis.length}명의 이름이 복사되었습니다!`);
  };

  // [추첨 명단에 추가 ➡️] 클릭
  const handleAddToDrawList = () => {
    let targetUsers = [];
    let emojiName = 'check';

    if (activeEmojiGroup && activeEmojiGroup.users && activeEmojiGroup.users.length > 0) {
      targetUsers = activeEmojiGroup.users.map(normalizeUser);
      emojiName = activeEmojiGroup.name;
    } else if (analyzedMsg && analyzedMsg.reactions && analyzedMsg.reactions.length > 0) {
      targetUsers = analyzedMsg.reactions[0].users.map(normalizeUser);
      emojiName = analyzedMsg.reactions[0].name;
    } else {
      targetUsers = FALLBACK_USERS.map(normalizeUser);
    }

    const group = {
      messageLink: slackUrl.trim() || 'Emoji Group',
      messageText: analyzedMsg ? analyzedMsg.text : '',
      emoji: emojiName,
      users: [...targetUsers]
    };

    setFeedbacks(prev => [...prev, group]);
    setBottomSheetCollapsed(false);
    setCurrentSlide(1);

    setTimeout(() => {
      if (slide2Ref.current) slide2Ref.current.scrollTop = 0;
    }, 50);
  };

  const handleSummonUnreacted = () => {
    const targetUsers = (unreactedUsers.length > 0 ? unreactedUsers : FALLBACK_USERS).map(normalizeUser);
    const group = {
      messageLink: slackUrl.trim() || 'Unreacted Group',
      messageText: '',
      emoji: '🚨 미반응자',
      users: [...targetUsers]
    };
    setFeedbacks(prev => [...prev, group]);
    setBottomSheetCollapsed(false);
    setCurrentSlide(1);

    setTimeout(() => {
      if (slide2Ref.current) slide2Ref.current.scrollTop = 0;
    }, 50);
  };

  const handleSummonChannelAll = () => {
    const uniqueUserMap = new Map();
    if (analyzedMsg && analyzedMsg.reactions) {
      analyzedMsg.reactions.forEach(r => {
        (r.users || []).map(normalizeUser).forEach(u => uniqueUserMap.set(u.id, u));
      });
    }
    if (uniqueUserMap.size === 0) {
      FALLBACK_USERS.forEach(u => uniqueUserMap.set(u.id, u));
    }
    const group = {
      messageLink: slackUrl.trim() || 'Channel Group',
      messageText: '',
      emoji: `🌐 채널 전체 (${uniqueUserMap.size}명)`,
      users: Array.from(uniqueUserMap.values())
    };
    setFeedbacks(prev => [...prev, group]);
    setBottomSheetCollapsed(false);
    setCurrentSlide(1);

    setTimeout(() => {
      if (slide2Ref.current) slide2Ref.current.scrollTop = 0;
    }, 50);
  };

  // 🎰 룰렛 추첨 가동
  const runSingleLotterySpin = (feedbacksInput = null, keepSlide = false) => {
    const sourceFeedbacks = feedbacksInput || feedbacks;
    let activeRunners = getUniqueActiveRunners(sourceFeedbacks);

    if (activeRunners.length === 0) {
      alert('모든 유저가 이미 추첨되었습니다!');
      return;
    }

    const allRunners = getAllRunners(sourceFeedbacks).length > 0 ? getAllRunners(sourceFeedbacks) : activeRunners;

    if (gameMode === 'podium') {
      setIsRolling(true);
      setShowCommentary(true);
      setCommentaryText('🎰 룰렛 돌리는 중... 틱틱틱!');

      const winnerIndex = Math.floor(Math.random() * activeRunners.length);
      const winner = activeRunners[winnerIndex];

      const targetIndex = 18;
      const reelList = buildCleanReelList(allRunners, winner, targetIndex);

      setReelCards(reelList);
      setTransitionStyle('none');
      setReelY(0);

      const CARD_HEIGHT = 54;
      const newTargetY = -(targetIndex * CARD_HEIGHT);
      lastTargetYRef.current = newTargetY;

      const SPIN_MS = 2400;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStyle(`transform ${SPIN_MS / 1000}s cubic-bezier(0.12, 0.82, 0.32, 1)`);
          setReelY(newTargetY);
        });
      });

      setTimeout(() => {
        setIsRolling(false);
        setCommentaryText(`🎉 [${getUserDisplayName(winner)}] 님 당첨!`);
        
        setReelCards(prev => prev.map((card, idx) => {
          if (idx === targetIndex) {
            return { ...card, isWinnerHighlight: true };
          }
          return card;
        }));

        setPickedWinners(prev => [...prev, winner]);
        setFeedbacks(prevFeedbacks => prevFeedbacks.map(f => ({
          ...f,
          users: f.users.map(u => (u.id === winner.id || getUserDisplayName(u) === getUserDisplayName(winner)) ? { ...u, done: true } : u)
        })));

        setCurrentSlide(2);

        setTimeout(() => {
          if (rankingScrollRef.current) {
            rankingScrollRef.current.scrollTop = rankingScrollRef.current.scrollHeight;
          }
        }, 100);
      }, SPIN_MS);

    } else {
      setIsRolling(true);
      setShowCommentary(true);
      setCommentaryText('👥 무작위 조 구성 중...');

      const count = Math.min(teamCount, activeRunners.length);
      const shuffled = [...activeRunners].sort(() => Math.random() - 0.5);
      const teams = Array.from({ length: count }, () => []);

      shuffled.forEach((runner, idx) => {
        teams[idx % count].push(runner);
      });

      setGroupTeams(teams);

      setTimeout(() => {
        setIsRolling(false);
        setCommentaryText('👥 무작위 조 구성 완료!');
        setCurrentSlide(2);
      }, 900);
    }
  };

  const handleDeleteFeedbackGroup = (idx) => {
    setFeedbacks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteAllRunners = () => {
    setPickedWinners([]);
    setFeedbacks([]);
    setGroupTeams(null);
  };

  const handleCopyResults = () => {
    if (gameMode === 'group' && groupTeams) {
      const lines = groupTeams.map((team, idx) => {
        const names = team.map(getUserDisplayName).join(', ');
        return `• ${idx + 1}팀: ${names}`;
      });
      navigator.clipboard.writeText(lines.join('\n'));
      alert('팀 구성 명단이 복사되었습니다!');
    } else if (pickedWinners.length > 0) {
      const copyText = pickedWinners.map((w, idx) => `${idx + 1}등: ${getUserDisplayName(w)}`).join('\n');
      navigator.clipboard.writeText(copyText);
      alert('당첨자 명단이 복사되었습니다!');
    }
  };

  // 🎯 홈으로 가기 (슬랙링크 & 분석 결과 유효 유지)
  const handleGoHome = () => {
    setPickedWinners([]);
    setGroupTeams(null);
    setFeedbacks([]);
    setReelCards([]);
    setCurrentSlide(0);
    setBottomSheetCollapsed(false);
    lastTargetYRef.current = 0;
  };

  const activeRunners = getUniqueActiveRunners();
  const userCentricList = getUserCentricAnalysis();

  return (
    <div className="meadow-canvas-full">
      {/* Top 2D Stage Viewport */}
      <div className="viewport-header">
        <h2>🎰 Slack Meadow</h2>
      </div>

      {/* 🎯 2D Stage Section */}
      <div id="lottery-stage" className="lottery-stage">
        {gameMode === 'podium' ? (
          <div id="roulette-stage" className="roulette-stage">
            <div className="roulette-title-badge">🎰 RANDOM ROULETTE</div>
            <div className="roulette-window-2d">
              <div className="target-line-2d">
                <span className="arrow-left">▶</span>
                <span className="arrow-right">◀</span>
              </div>
              <div
                id="roulette-reel-container"
                className="roulette-reel-container"
                style={{ transition: transitionStyle, transform: `translateY(${reelY}px)` }}
              >
                {reelCards.length === 0 ? (
                  <div className="picker-card-2d empty-card">
                    <span className="card-avatar-text">🌱</span>
                    <span className="card-name">명단을 소환해 보세요!</span>
                  </div>
                ) : (
                  reelCards.map((u, idx) => {
                    const isDone = u.done && !u.isTarget;
                    const displayName = getUserDisplayName(u);
                    let cardClass = 'picker-card-2d';
                    if (isDone) cardClass += ' done-runner-card';
                    if (u.isWinnerHighlight) cardClass += ' winner-highlight';

                    return (
                      <div key={idx} className={cardClass} data-index={idx}>
                        <img
                          src={getAvatarUrl(u)}
                          onError={(e) => handleImgError(e, displayName)}
                          className="card-avatar"
                          alt=""
                        />
                        <span className="card-name">
                          {u.isWinnerHighlight ? `🎉 ${displayName}` : (isDone ? <del style={{ color: '#858a8d' }}>{displayName}</del> : displayName)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div id="group-dealer-stage" className="group-dealer-stage">
            <div className="roulette-title-badge">👥 GROUP DEALER</div>
            <div id="group-boxes-grid" className="group-boxes-grid">
              {groupTeams && groupTeams.map((team, tIdx) => (
                <div key={tIdx} className="group-team-box">
                  <div className="team-title"><span>TEAM ${tIdx + 1}</span> <span>{team.length}명</span></div>
                  <div className="team-members" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {team.map(m => (
                      <span key={m.id} className="group-member-pill">{getUserDisplayName(m)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showCommentary && (
          <div id="race-commentary" className="race-commentary-bar">
            <span className="commentary-text">{commentaryText}</span>
            <button type="button" className="btn-skip-race" onClick={() => setShowCommentary(false)}>SKIP ⏩</button>
          </div>
        )}
      </div>

      {/* 📱 Bottom Sheet Modal */}
      <div id="bottom-sheet" className={`bottom-sheet ${bottomSheetCollapsed ? 'collapsed' : ''}`}>
        <div id="bottom-sheet-handle" className="bottom-sheet-handle" onClick={() => setBottomSheetCollapsed(!bottomSheetCollapsed)}>
          <div className="handle-bar"></div>
        </div>

        <div className="panel-body">
          <div className="slider-container">
            <div
              id="slider-wrapper"
              className="slider-wrapper"
              style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
            >
              {/* Slide 1: Input & Emoji Analysis */}
              <div className="slide-panel" id="slide-1">
                <header className="panel-header">
                  <div className="logo-row">
                    <div className="logo">
                      <span className="emoji-logo">🌱</span>
                      <h1>Slack Meadow</h1>
                    </div>
                  </div>
                  <p className="panel-subtitle">이모지 반응자를 분석해 무작위 추첨을 시작해보세요.</p>
                </header>

                <section className="panel-card input-card">
                  <h3>슬랙 링크 분석</h3>
                  <form onSubmit={handleAnalyze}>
                    <div className="form-group input-with-btn">
                      <input
                        type="url"
                        value={slackUrl}
                        onChange={(e) => setSlackUrl(e.target.value)}
                        placeholder="슬랙 메시지 링크 입력..."
                        required
                      />
                      {/* 🎯 모바일/데스크톱 모두 작동하는 명확한 붙여넣기/지우기 버튼 */}
                      <button type="button" className="btn-paste-clip" onClick={handlePasteOrClear}>
                        {slackUrl ? '❌ 지우기' : '📋 붙여넣기'}
                      </button>
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      <span className="btn-text">{loading ? '분석 중...' : '이모지 가져오기'}</span>
                    </button>
                  </form>
                  {statusMsg && <div className="status-message" style={{ marginTop: '8px' }}>{statusMsg}</div>}
                </section>

                {analyzedMsg && (
                  <section className="panel-card result-card">
                    <div className="message-info">
                      <img
                        src={getAvatarUrl(analyzedMsg.user)}
                        onError={(e) => handleImgError(e, getUserDisplayName(analyzedMsg.user))}
                        className="avatar"
                        alt=""
                      />
                      <div className="message-info-body">
                        <div className="message-info-header">
                          <span className="username">{getUserDisplayName(analyzedMsg.user)}</span>
                        </div>
                        <p className="message-content" dangerouslySetInnerHTML={{ __html: parseTextEmojis(analyzedMsg.text, customEmojis) }}></p>
                      </div>
                    </div>

                    <div className="tab-menu-row">
                      <button
                        type="button"
                        className={`sub-tab-btn ${activeTab === 'emojis' ? 'active' : ''}`}
                        onClick={() => setActiveTab('emojis')}
                      >
                        😃 이모지 반응자
                      </button>
                      <button
                        type="button"
                        className={`sub-tab-btn ${activeTab === 'unreacted' ? 'active' : ''}`}
                        onClick={() => setActiveTab('unreacted')}
                      >
                        🚨 미반응자 ({unreactedUsers.length}명)
                      </button>
                    </div>

                    {activeTab === 'emojis' ? (
                      <div>
                        <div className="emoji-filters-header">
                          <h4>이모지 반응 선택</h4>
                        </div>
                        <div className="emoji-filter-chips">
                          {analyzedMsg.reactions && analyzedMsg.reactions.map((r, idx) => (
                            <div
                              key={r.name}
                              className={`emoji-chip ${activeEmojiGroup && activeEmojiGroup.name === r.name ? 'selected' : ''}`}
                              onClick={() => setActiveEmojiGroup(r)}
                            >
                              <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(r.name, customEmojis) }}></span>
                              <span className="chip-count"> {r.count}</span>
                            </div>
                          ))}
                        </div>

                        {activeEmojiGroup && (
                          <div className="selected-emoji-detail" style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '10px' }}>
                            <div className="emoji-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="emoji-badge" dangerouslySetInnerHTML={{ __html: renderEmojiIcon(activeEmojiGroup.name, customEmojis) }}></span>
                                <span className="count-label" style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>{activeEmojiGroup.users ? activeEmojiGroup.users.length : 0}명 (반응 순서)</span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button type="button" className="btn-xs-green" onClick={() => handleCopyEmojiUsers(activeEmojiGroup)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                  📋 명단 복사
                                </button>
                                <button type="button" className="btn-success" onClick={handleAddToDrawList} style={{ padding: '5px 10px', fontSize: '11px' }}>
                                  추첨 명단에 추가 ➡️
                                </button>
                              </div>
                            </div>
                            <div className="detail-user-list">
                              {(activeEmojiGroup.users || []).map((u, i) => (
                                <div key={i} className="user-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '12px', margin: '2px', fontSize: '12px' }}>
                                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{i + 1}.</span>
                                  <img
                                    src={getAvatarUrl(u)}
                                    onError={(e) => handleImgError(e, getUserDisplayName(u))}
                                    style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                                    alt=""
                                  />
                                  <span>{getUserDisplayName(u)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="unreacted-box">
                        <div className="unreacted-top">
                          <span>채널 참여자 중 반응을 달지 않은 유저입니다.</span>
                          <div className="unreacted-btns">
                            <button type="button" className="btn-xs-green" onClick={() => {
                              const names = unreactedUsers.map(getUserDisplayName).join(' ');
                              navigator.clipboard.writeText(names);
                              alert('미반응자 명단이 복사되었습니다!');
                            }}>📋 명단 복사</button>
                            <button type="button" className="btn-xs-indigo" onClick={handleSummonUnreacted}>🎰 추첨 명단에 추가 ➡️</button>
                          </div>
                        </div>
                        <div className="unreacted-user-list">
                          {unreactedUsers.map((u, i) => (
                            <div key={i} className="unreacted-user-item">
                              <img
                                src={getAvatarUrl(u)}
                                onError={(e) => handleImgError(e, getUserDisplayName(u))}
                                alt=""
                              />
                              <span>{getUserDisplayName(u)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 사람 기준 이모지 반응 집계 분석 패널 */}
                    <div className="user-analysis-section" style={{ marginTop: '14px' }}>
                      <button type="button" className="btn-secondary-outline" onClick={() => setShowUserAnalysis(!showUserAnalysis)} style={{ width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600 }}>
                        📊 {showUserAnalysis ? '사람 기준 이모지 현황 닫기 ▲' : `📊 사람 기준 이모지 반응 목록 보기 (${userCentricList.length}명) ▼`}
                      </button>

                      {showUserAnalysis && (
                        <div className="user-analysis-panel" style={{ marginTop: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px' }}>
                          <div className="analysis-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>👥 참여 유저 총 {userCentricList.length}명 (반응 순서)</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button type="button" className="btn-xs-green" onClick={handleCopyPersonCentricAnalysis} style={{ background: '#059669', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                📋 전체 현황 복사
                              </button>
                              <button type="button" className="btn-xs-indigo" onClick={handleCopyUserNamesSpaced} style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                                📋 이름만 복사
                              </button>
                            </div>
                          </div>

                          <div className="user-analysis-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {userCentricList.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #e2e8f0', fontSize: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, minWidth: '16px' }}>{idx + 1}.</span>
                                  <img
                                    src={getAvatarUrl(item.user)}
                                    onError={(e) => handleImgError(e, item.name)}
                                    style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                                    alt=""
                                  />
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {item.emojis.map((emojiName, eIdx) => (
                                    <span key={eIdx} dangerouslySetInnerHTML={{ __html: renderEmojiIcon(emojiName, customEmojis) }} style={{ fontSize: '14px' }}></span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Slide 2: Draw Config & Runners List */}
              <div className="slide-panel" id="slide-2" ref={slide2Ref}>
                <header className="slide-header-nav" style={{ marginBottom: '8px' }}>
                  <button type="button" className="btn-prev-slide" onClick={() => setCurrentSlide(0)}>
                    ⬅️ 뒤로가기
                  </button>
                </header>

                <div className="game-mode-panel panel-card" id="game-mode-panel" style={{ marginBottom: '10px' }}>
                  <div className="mode-header-top">
                    <span className="mode-title-tag">🎮 추첨 모드</span>
                    <button type="button" className="btn-channel-all" onClick={handleSummonChannelAll}>
                      🌐 채널 전체로 돌리기
                    </button>
                  </div>
                  
                  <div className="mode-tab-row" style={{ display: 'flex', gap: '8px', margin: '8px 0' }}>
                    <label className="mode-tab-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        name="game-mode"
                        value="podium"
                        checked={gameMode === 'podium'}
                        onChange={() => setGameMode('podium')}
                      />
                      <span className="mode-tab-btn" style={{ textAlign: 'center', width: '100%' }}>🏆 무작위 추첨</span>
                    </label>
                    <label className="mode-tab-label" style={{ flex: 1 }}>
                      <input
                        type="radio"
                        name="game-mode"
                        value="group"
                        checked={gameMode === 'group'}
                        onChange={() => setGameMode('group')}
                      />
                      <span className="mode-tab-btn" style={{ textAlign: 'center', width: '100%' }}>👥 조 짜기 (팀 나누기)</span>
                    </label>
                  </div>

                  {gameMode === 'group' && (
                    <div className="mode-config-row">
                      <div className="config-item" id="config-group">
                        <span className="config-label">나눌 조 개수</span>
                        <div className="stepper-control">
                          <button type="button" className="btn-stepper" onClick={() => setTeamCount(Math.max(2, teamCount - 1))}>-</button>
                          <input type="number" value={teamCount} readOnly />
                          <button type="button" className="btn-stepper" onClick={() => setTeamCount(Math.min(10, teamCount + 1))}>+</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <section className="panel-card feedback-card">
                  <div className="feedback-card-header">
                    <h3>추첨 명단</h3>
                    <div className="header-actions">
                      <button type="button" className="btn-action-xs btn-danger-xs" onClick={handleDeleteAllRunners}>전체삭제</button>
                    </div>
                  </div>

                  <div className="feedback-list-container">
                    {feedbacks.length === 0 ? (
                      <p className="empty-text">소환된 유저가 없습니다. 슬랙 메시지를 분석해 소환해보세요!</p>
                    ) : (
                      feedbacks.map((f, fIdx) => (
                        <div key={fIdx} className="feedback-group-item" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                          <div className="group-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>
                            <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(f.emoji, customEmojis) + ` (${f.users ? f.users.length : 0}명)` }}></span>
                            <button type="button" className="btn-danger-xs" onClick={() => handleDeleteFeedbackGroup(fIdx)} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>삭제</button>
                          </div>
                          <div className="group-users" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {(f.users || []).map((u, i) => (
                              <span key={i} className="user-tag" style={{ fontSize: '12px', background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 500, opacity: u.done ? 0.4 : 1, textDecoration: u.done ? 'line-through' : 'none' }}>
                                {i + 1}. {getUserDisplayName(u)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button type="button" className="btn-primary btn-race" onClick={() => runSingleLotterySpin()} style={{ marginTop: '12px', padding: '13px', fontSize: '15px' }}>
                    {gameMode === 'podium' ? '🎰 추첨 시작!' : '🎴 조 짜기 (팀 나누기)!'}
                  </button>
                </section>
              </div>

              {/* Slide 3: Final Results View */}
              <div className="slide-panel" id="slide-3" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <section className="panel-card ranking-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', marginBottom: 0 }}>
                  <div className="ranking-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                    <h3 style={{ margin: 0 }}>🎉 추첨 결과</h3>
                    <button type="button" className="btn-success-sm" onClick={handleCopyResults}>
                      📋 명단 복사
                    </button>
                  </div>

                  <div ref={rankingScrollRef} className="ranking-scroll-container" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingRight: '2px', marginBottom: '10px' }}>
                    {gameMode === 'podium' ? (
                      <div className="ranking-list-view">
                        {pickedWinners.map((w, idx) => (
                          <div key={idx} className="winner-result-card" id={`winner-card-${idx}`}>
                            <span className="winner-rank-badge">{idx + 1}등</span>
                            <img
                              src={getAvatarUrl(w)}
                              onError={(e) => handleImgError(e, getUserDisplayName(w))}
                              className="winner-avatar"
                              alt=""
                            />
                            <div className="winner-info">
                              <div className="name">{getUserDisplayName(w)}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>🎉 축하합니다! (중복제외 100% 적용)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="group-ranking-view">
                        {groupTeams && groupTeams.map((team, tIdx) => (
                          <div key={tIdx} className="panel-card" style={{ textAlign: 'left', marginBottom: '8px' }}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '6px' }}>TEAM {tIdx + 1} ({team.length}명)</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {team.map((m, mIdx) => (
                                <span key={mIdx} className="group-member-pill">{getUserDisplayName(m)}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="ranking-actions-fixed" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e4e5e7', background: '#ffffff' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={gameMode === 'podium' && activeRunners.length === 0}
                      onClick={() => {
                        if (gameMode === 'podium' && activeRunners.length > 0) {
                          runSingleLotterySpin(null, true);
                        } else if (gameMode === 'group') {
                          runSingleLotterySpin(null, true);
                        }
                      }}
                      style={{ margin: 0 }}
                    >
                      <span className="btn-text">
                        {gameMode === 'podium' 
                          ? (activeRunners.length > 0 ? `🎰 다음 당첨자 뽑기 (남은 ${activeRunners.length}명)` : '🎉 모든 당첨자 추첨 완료!')
                          : '🎴 다시 조 짜기'}
                      </span>
                    </button>
                    <button type="button" className="btn-secondary-outline" onClick={handleGoHome} style={{ margin: 0 }}>
                      🏠 홈으로 가기
                    </button>
                  </div>
                </section>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Render React Root
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
