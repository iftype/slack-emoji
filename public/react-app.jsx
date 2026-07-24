// Slack Meadow - Complete React 18 Application Component (Direct Spin on Emoji Pick & Zero-Fail Guarantee)

const { useState, useEffect, useRef } = React;

// 1. Emoji & Shortcode Helper Module
const EMOJI_MAP = {
  'one': '1️⃣', 'two': '2️⃣', 'three': '3️⃣', 'four': '4️⃣', 'five': '5️⃣',
  'six': '6️⃣', 'seven': '7️⃣', 'eight': '8️⃣', 'nine': '9️⃣', 'zero': '0️⃣',
  'keycap_ten': '🔟', '+1': '👍', '-1': '👎', 'thumbsup': '👍', 'thumbsdown': '👎',
  'heart': '❤️', 'tada': '🎉', 'fire': '🔥', 'smile': '😄', 'check': '✅',
  'raising_hand': '🙋', 'eyes': '👀', 'rocket': '🚀', '100': '💯'
};

function renderEmojiIcon(name, customCache = {}) {
  if (!name) return '😃';
  const lower = name.toLowerCase();
  if (customCache[lower]) {
    return `<img src="${customCache[lower]}" alt=":${name}:" class="custom-emoji-img" style="width:18px;height:18px;vertical-align:middle;">`;
  }
  if (EMOJI_MAP[lower]) return EMOJI_MAP[lower];
  if (/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(name)) return name;
  return `:${name}:`;
}

function parseTextEmojis(text, customCache = {}) {
  if (!text) return '';
  let parsed = text;
  Object.keys(customCache).forEach(name => {
    const regex = new RegExp(`:${name}:`, 'g');
    parsed = parsed.replace(regex, `<img src="${customCache[name]}" alt=":${name}:" class="custom-emoji-img" style="width:18px;height:18px;vertical-align:middle;">`);
  });
  Object.keys(EMOJI_MAP).forEach(name => {
    const regex = new RegExp(`:${name}:`, 'g');
    parsed = parsed.replace(regex, EMOJI_MAP[name]);
  });
  return parsed;
}

// 🛡️ Fallback Backup Users (Zero-Fail Guarantee)
const FALLBACK_USERS = [
  { id: 'usr_1', name: '재키(최재영)', real_name: '재키(최재영)', display_name: '재키(최재영)', avatar: 'https://ca.slack-edge.com/T000-U001-avatar.png' },
  { id: 'usr_2', name: '와이제리(최용준)', real_name: '와이제리(최용준)', display_name: '와이제리(최용준)', avatar: 'https://ca.slack-edge.com/T000-U002-avatar.png' },
  { id: 'usr_3', name: '바니(임혜정)', real_name: '바니(임혜정)', display_name: '바니(임혜정)', avatar: 'https://ca.slack-edge.com/T000-U003-avatar.png' },
  { id: 'usr_4', name: '호이(조상준)', real_name: '호이(조상준)', display_name: '호이(조상준)', avatar: 'https://ca.slack-edge.com/T000-U004-avatar.png' },
  { id: 'usr_5', name: '정콩이(유정빈)', real_name: '정콩이(유정빈)', display_name: '정콩이(유정빈)', avatar: 'https://ca.slack-edge.com/T000-U005-avatar.png' },
  { id: 'usr_6', name: '이스타', real_name: '이스타', display_name: '이스타', avatar: '' },
  { id: 'usr_7', name: '정찬', real_name: '정찬', display_name: '정찬', avatar: '' }
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

// 2. API Communication Service
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : 'https://iftype.store/slack';

const SlackApi = {
  async fetchCustomEmojis() {
    try {
      const res = await fetch(`${API_BASE}/api/emojis`);
      const data = await res.json();
      return (data.ok && data.emojis) ? data.emojis : {};
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
    return data.message;
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

  // Game Mode & Steppers
  const [gameMode, setGameMode] = useState('podium'); // 'podium' | 'group'
  const [winnerCount, setWinnerCount] = useState(1);
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

  // Initialize
  useEffect(() => {
    SlackApi.fetchCustomEmojis().then(setCustomEmojis);
    
    // Default initial preview reel
    let cyclic = [];
    for (let i = 0; i < 5; i++) {
      cyclic.push(...shuffleArray(FALLBACK_USERS.map(normalizeUser)));
    }
    setReelCards(cyclic);
  }, []);

  // Compute Active / All Runners
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

  const getUniqueActiveRunners = (sourceFeedbacks = null) => {
    const target = sourceFeedbacks || feedbacks;
    const runnerMap = new Map();
    target.forEach(f => {
      if (f && Array.isArray(f.users)) {
        f.users.forEach(rawU => {
          const u = normalizeUser(rawU);
          if (u.id && !u.done && !runnerMap.has(u.id)) runnerMap.set(u.id, u);
        });
      }
    });
    return Array.from(runnerMap.values());
  };

  // Preview Reel Update
  useEffect(() => {
    if (!isRolling) {
      const activeRunners = getUniqueActiveRunners();
      const displayRunners = activeRunners.length > 0 ? activeRunners : FALLBACK_USERS.map(normalizeUser);
      let cyclic = [];
      for (let i = 0; i < 5; i++) {
        cyclic.push(...shuffleArray(displayRunners));
      }
      setReelCards(cyclic);
      setReelY(0);
      setTransitionStyle('none');
      lastTargetYRef.current = 0;
    }
  }, [feedbacks, isRolling]);

  // Clipboard Paste Helper
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.includes('slack.com/archives/')) {
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
          if (match) setSlackUrl(match[0]);
        }
      }
    } catch (e) {}
  };

  // Form Submission
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!slackUrl.trim()) return;
    setLoading(true);
    setStatusMsg('');

    try {
      const msg = await SlackApi.analyzeSlackUrl(slackUrl.trim());
      setAnalyzedMsg(msg);
      setUnreactedUsers((msg.unreactedUsers || []).map(normalizeUser));
      if (msg.reactions && msg.reactions.length > 0) {
        setActiveEmojiGroup(msg.reactions[0]);
      }
    } catch (err) {
      setStatusMsg(err.message);
      const fallbackMsg = {
        user: FALLBACK_USERS[0],
        ts: Date.now() / 1000,
        text: '슬랙 메시지 분석 완료 (샘플 데이터)',
        reactions: [{ name: 'check', count: 7, users: FALLBACK_USERS }]
      };
      setAnalyzedMsg(fallbackMsg);
      setActiveEmojiGroup(fallbackMsg.reactions[0]);
    } finally {
      setLoading(false);
    }
  };

  // 🎰 Roulette Core Spin Animation
  const runSingleLotterySpin = (feedbacksInput = null) => {
    const sourceFeedbacks = feedbacksInput || feedbacks;
    let activeRunners = getUniqueActiveRunners(sourceFeedbacks);

    if (activeRunners.length === 0) {
      const fallbackGroup = {
        messageLink: 'Auto Group',
        messageText: '',
        emoji: 'check',
        users: shuffleArray(FALLBACK_USERS.map(normalizeUser))
      };
      sourceFeedbacks.push(fallbackGroup);
      setFeedbacks([...sourceFeedbacks]);
      activeRunners = fallbackGroup.users;
    }

    const allRunners = getAllRunners(sourceFeedbacks).length > 0 ? getAllRunners(sourceFeedbacks) : activeRunners;
    setBottomSheetCollapsed(false);
    setCurrentSlide(0); // Move to slide 0 so top roulette stage is 100% visible

    if (gameMode === 'podium') {
      setIsRolling(true);
      setShowCommentary(true);
      setCommentaryText('🎰 룰렛 돌리는 중... 틱틱틱!');

      // Select random winner from active runners
      const winnerIndex = Math.floor(Math.random() * activeRunners.length);
      const winner = activeRunners[winnerIndex];

      // Build 15-cycle continuous reel
      const REPEAT_COUNT = 15;
      let reelList = [];
      const baseCycle = [...allRunners].sort(() => Math.random() - 0.5);

      for (let r = 0; r < REPEAT_COUNT; r++) {
        baseCycle.forEach(u => {
          const recent3 = reelList.slice(-3);
          if (!recent3.some(item => item.id === u.id)) {
            reelList.push(u);
          }
        });
      }

      while (reelList.length < 30) {
        allRunners.forEach(u => reelList.push(u));
      }

      const targetIndex = Math.floor(reelList.length * 0.75);
      reelList[targetIndex] = { ...winner, done: false, isTarget: true };

      setReelCards(reelList);
      setTransitionStyle('none');
      setReelY(lastTargetYRef.current);

      const CARD_HEIGHT = 54;
      const newTargetY = -(targetIndex * CARD_HEIGHT) + 53;
      lastTargetYRef.current = newTargetY;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStyle('transform 2.4s cubic-bezier(0.12, 0.82, 0.32, 1)');
          setReelY(newTargetY);
        });
      });

      setTimeout(() => {
        setIsRolling(false);
        setCommentaryText(`🎉 [${getUserDisplayName(winner)}] 님 당첨!`);
        
        // Highlight winner card
        setReelCards(prev => prev.map((card, idx) => {
          if (idx === targetIndex) {
            return { ...card, isWinnerHighlight: true };
          }
          return card;
        }));

        // Update winner state
        setPickedWinners(prev => [...prev, winner]);
        setFeedbacks(prevFeedbacks => prevFeedbacks.map(f => ({
          ...f,
          users: f.users.map(u => u.id === winner.id ? { ...u, done: true } : u)
        })));

        setTimeout(() => {
          setCurrentSlide(2); // Slide to result view
        }, 800);
      }, 2500);

    } else {
      // Group Dealer Mode
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

  // 🚨 [초록색 "추첨하기" 버튼 클릭 시 -> 즉시 명단 추가 + 룰렛 직행 회전 구동!]
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
      users: shuffleArray(targetUsers)
    };

    const nextFeedbacks = [...feedbacks, group];
    setFeedbacks(nextFeedbacks);
    
    // 🔥 초록색 추첨하기 버튼 누르자마자 룰렛 직행 회전 구동!
    runSingleLotterySpin(nextFeedbacks);
  };

  // Summon Unreacted Users
  const handleSummonUnreacted = () => {
    const targetUsers = (unreactedUsers.length > 0 ? unreactedUsers : FALLBACK_USERS).map(normalizeUser);
    const group = {
      messageLink: slackUrl.trim() || 'Unreacted Group',
      messageText: '',
      emoji: '🚨 미반응자',
      users: shuffleArray(targetUsers)
    };
    const nextFeedbacks = [...feedbacks, group];
    setFeedbacks(nextFeedbacks);
    runSingleLotterySpin(nextFeedbacks);
  };

  // Summon Channel All
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
      users: shuffleArray(Array.from(uniqueUserMap.values()))
    };
    const nextFeedbacks = [...feedbacks, group];
    setFeedbacks(nextFeedbacks);
    runSingleLotterySpin(nextFeedbacks);
  };

  const handleDeleteFeedbackGroup = (idx) => {
    setFeedbacks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteAllRunners = () => {
    setPickedWinners([]);
    setFeedbacks([]);
    setGroupTeams(null);
  };

  // Copy Result Formatting Helper
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

  const handleConfirmAndClose = () => {
    setPickedWinners([]);
    setCurrentSlide(0);
    setBottomSheetCollapsed(true);
  };

  const activeRunners = getUniqueActiveRunners();

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
                        <img src={u.avatar || 'https://via.placeholder.com/32'} className="card-avatar" alt="" />
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
                  <div className="team-title"><span>TEAM {tIdx + 1}</span> <span>{team.length}명</span></div>
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
                      <button type="button" className="btn-paste-clip" onClick={handlePasteClipboard}>
                        📋 붙여넣기
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
                      <img src={analyzedMsg.user?.avatar || 'https://via.placeholder.com/40'} className="avatar" alt="" />
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
                          <div className="selected-emoji-detail">
                            <div className="emoji-detail-header">
                              <span className="emoji-badge" dangerouslySetInnerHTML={{ __html: renderEmojiIcon(activeEmojiGroup.name, customEmojis) }}></span>
                              <span className="count-label">{activeEmojiGroup.users ? activeEmojiGroup.users.length : 0}명</span>
                              <button type="button" className="btn-success" onClick={handleAddToDrawList}>
                                추첨하기
                              </button>
                            </div>
                            <div className="detail-user-list">
                              {(activeEmojiGroup.users || []).map((u, i) => (
                                <div key={i} className="user-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f5f5f7', padding: '3px 8px', borderRadius: '12px', margin: '2px', fontSize: '12px' }}>
                                  <img src={u.avatar || 'https://via.placeholder.com/20'} style={{ width: '18px', height: '18px', borderRadius: '50%' }} alt="" />
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
                            }}>📋 명단 복사</button>
                            <button type="button" className="btn-xs-indigo" onClick={handleSummonUnreacted}>🎰 추첨기에 추가</button>
                          </div>
                        </div>
                        <div className="unreacted-user-list">
                          {unreactedUsers.map((u, i) => (
                            <div key={i} className="unreacted-user-item">
                              <img src={u.avatar || 'https://via.placeholder.com/22'} alt="" />
                              <span>{getUserDisplayName(u)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="user-analysis-section">
                      <button type="button" className="btn-secondary-outline" onClick={() => setShowUserAnalysis(!showUserAnalysis)}>
                        📊 유저별 이모지 반응 목록 보기
                      </button>
                      {showUserAnalysis && (
                        <div className="user-analysis-panel">
                          {analyzedMsg.reactions && analyzedMsg.reactions.map((r, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                              <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(r.name, customEmojis) }}></span>
                              <span>{(r.users || []).map(getUserDisplayName).join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Slide 2: Draw Config & Runners List */}
              <div className="slide-panel" id="slide-2">
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
                  <div className="mode-tab-row">
                    <label className="mode-tab-label">
                      <input
                        type="radio"
                        name="game-mode"
                        value="podium"
                        checked={gameMode === 'podium'}
                        onChange={() => setGameMode('podium')}
                      />
                      <span className="mode-tab-btn">🏆 무작위 추첨</span>
                    </label>
                    <label className="mode-tab-label">
                      <input
                        type="radio"
                        name="game-mode"
                        value="group"
                        checked={gameMode === 'group'}
                        onChange={() => setGameMode('group')}
                      />
                      <span className="mode-tab-btn">👥 조 짜기</span>
                    </label>
                  </div>

                  <div className="mode-config-row">
                    {gameMode === 'podium' ? (
                      <div className="config-item" id="config-podium">
                        <span className="config-label">당첨 인원 수</span>
                        <div className="stepper-control">
                          <button type="button" className="btn-stepper" onClick={() => setWinnerCount(Math.max(1, winnerCount - 1))}>-</button>
                          <input type="number" value={winnerCount} readOnly />
                          <button type="button" className="btn-stepper" onClick={() => setWinnerCount(Math.min(50, winnerCount + 1))}>+</button>
                        </div>
                      </div>
                    ) : (
                      <div className="config-item" id="config-group">
                        <span className="config-label">나눌 조 개수</span>
                        <div className="stepper-control">
                          <button type="button" className="btn-stepper" onClick={() => setTeamCount(Math.max(2, teamCount - 1))}>-</button>
                          <input type="number" value={teamCount} readOnly />
                          <button type="button" className="btn-stepper" onClick={() => setTeamCount(Math.min(10, teamCount + 1))}>+</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <section className="panel-card feedback-card">
                  <div className="feedback-card-header">
                    <h3>추첨 명단</h3>
                    <div class="header-actions">
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
                                {getUserDisplayName(u)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button type="button" className="btn-primary btn-race" onClick={() => runSingleLotterySpin()} style={{ marginTop: '12px', padding: '13px', fontSize: '15px' }}>
                    🎰 {gameMode === 'podium' ? '추첨 시작!' : '팀 나누기!'}
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

                  <div className="ranking-scroll-container" style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingRight: '2px', marginBottom: '10px' }}>
                    {gameMode === 'podium' ? (
                      <div className="ranking-list-view">
                        {pickedWinners.map((w, idx) => (
                          <div key={idx} className="winner-result-card" id={`winner-card-${idx}`}>
                            <span className="winner-rank-badge">{idx + 1}등</span>
                            <img src={w.avatar || 'https://via.placeholder.com/44'} className="winner-avatar" alt="" />
                            <div className="winner-info">
                              <div className="name">{getUserDisplayName(w)}</div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>🎉 축하합니다! (자동 중복제외 적용)</div>
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
                          runSingleLotterySpin();
                        } else if (gameMode === 'group') {
                          runSingleLotterySpin();
                        }
                      }}
                      style={{ margin: 0 }}
                    >
                      <span className="btn-text">
                        {gameMode === 'podium' 
                          ? (activeRunners.length > 0 ? `🎰 다음 당첨자 뽑기 (남은 ${activeRunners.length}명)` : '🎉 추첨 완료')
                          : '다시 조 짜기'}
                      </span>
                    </button>
                    <button type="button" className="btn-secondary-outline" onClick={handleConfirmAndClose} style={{ margin: 0 }}>
                      확정 및 닫기
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
