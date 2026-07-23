// Slack Pick Studio - React 18 Application Migration

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

// 2. API Communication Service
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3001'
  : 'https://iftype.store/slack/api';

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
  },

  async fetchFeedbacks() {
    try {
      const res = await fetch(`${API_BASE}/api/feedbacks?_t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      return (data.ok) ? data.feedbacks : [];
    } catch (e) {
      return [];
    }
  },

  async saveFeedbackGroup(messageLink, messageText, emoji, users) {
    const res = await fetch(`${API_BASE}/api/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageLink, messageText, emoji, users })
    });
    const data = await res.json();
    return (data.ok) ? data.feedbacks : [];
  },

  async deleteFeedbackGroup(messageLink, emoji) {
    const res = await fetch(`${API_BASE}/api/feedbacks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageLink, emoji })
    });
    const data = await res.json();
    return (data.ok) ? data.feedbacks : [];
  }
};

// 3. Main React Application Component
function App() {
  // State
  const [slackUrl, setSlackUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [analyzedMsg, setAnalyzedMsg] = useState(null);
  const [customEmojis, setCustomEmojis] = useState({});
  const [unreactedUsers, setUnreactedUsers] = useState([]);
  
  const [activeTab, setActiveTab] = useState('emojis'); // 'emojis' | 'unreacted'
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [selectAll, setSelectAll] = useState(false);
  const [showUserAnalysis, setShowUserAnalysis] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [pickedWinners, setPickedWinners] = useState([]);
  
  const [gameMode, setGameMode] = useState('podium'); // 'podium' | 'group'
  const [winCount, setWinCount] = useState(1);
  const [teamCount, setTeamCount] = useState(2);

  const [currentSlide, setCurrentSlide] = useState(0); // 0: Input/Analysis, 1: Feedback/Config, 2: Result
  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);

  const [isRolling, setIsRolling] = useState(false);
  const [reelY, setReelY] = useState(0);
  const [reelWinners, setReelWinners] = useState(null);
  const [groupTeams, setGroupTeams] = useState(null);
  const [commentary, setCommentary] = useState('');

  const animRef = useRef(null);

  // Initialize
  useEffect(() => {
    SlackApi.fetchCustomEmojis().then(setCustomEmojis);
    // 🚨 수동 클릭 시에만 붙여넣도록 focus 이벤트 완전 방지!
  }, []);

  // 📋 수동 클립보드 붙여넣기 버튼 클릭 핸들러 (자동 실행 100% 제거)
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.includes('slack.com/archives/')) {
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.slack\.com\/archives\/[A-Z0-9]+\/p\d+/);
          if (match) {
            setSlackUrl(match[0]);
          }
        }
      }
    } catch (e) {
      alert('클립보드 읽기 권한이 없습니다. 직접 붙여넣기를 해주세요.');
    }
  };

  // Analyze Submit
  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!slackUrl.trim()) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const msg = await SlackApi.analyzeSlackUrl(slackUrl.trim());
      setAnalyzedMsg(msg);
      setUnreactedUsers(msg.unreactedUsers || []);
      setSelectedEmoji(null);
      setSelectAll(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get active unique runners
  const getUniqueActiveRunners = () => {
    const runnerMap = new Map();
    feedbacks.forEach(f => {
      f.users.forEach(u => {
        if (!u.done && !runnerMap.has(u.id)) {
          runnerMap.set(u.id, u);
        }
      });
    });
    return Array.from(runnerMap.values());
  };

  // Add to Feedback / Draw list
  const handleAddToDrawList = async () => {
    if (!analyzedMsg || !selectedEmoji) return;
    const updated = await SlackApi.saveFeedbackGroup(
      slackUrl.trim(),
      analyzedMsg.text,
      selectedEmoji.name,
      selectedEmoji.users
    );
    setFeedbacks(updated);
    setCurrentSlide(1);
    setBottomSheetCollapsed(false);
  };

  // Summon Unreacted Users
  const handleSummonUnreacted = async () => {
    if (unreactedUsers.length === 0) return;
    const updated = await SlackApi.saveFeedbackGroup(slackUrl.trim(), '', '🚨 미반응자', unreactedUsers);
    setFeedbacks(updated);
    setCurrentSlide(1);
    setBottomSheetCollapsed(false);
  };

  // Summon All Channel Members
  const handleSummonChannelAll = async () => {
    if (!analyzedMsg || !analyzedMsg.channel) {
      alert('슬랙 링크를 먼저 분석해주시거나 채널 정보가 필요합니다!');
      return;
    }
    const allUsers = [...unreactedUsers];
    if (analyzedMsg.reactions) {
      const userMap = new Map();
      analyzedMsg.reactions.forEach(r => r.users.forEach(u => userMap.set(u.id, u)));
      userMap.forEach(u => allUsers.push(u));
    }
    const updated = await SlackApi.saveFeedbackGroup(slackUrl.trim(), '', '🌐 채널 전체 인원', allUsers);
    setFeedbacks(updated);
    setCurrentSlide(1);
    setBottomSheetCollapsed(false);
  };

  // Delete Feedback Group
  const handleDeleteFeedback = async (link, emoji) => {
    const updated = await SlackApi.deleteFeedbackGroup(link, emoji);
    setFeedbacks(updated);
  };

  // Delete All Runners
  const handleDeleteAllRunners = async () => {
    if (window.confirm('소환된 명단을 모두 삭제하시겠습니까?')) {
      setPickedWinners([]);
      for (const f of [...feedbacks]) {
        await SlackApi.deleteFeedbackGroup(f.messageLink, f.emoji);
      }
      setFeedbacks([]);
      setReelWinners(null);
    }
  };

  // 🎰 Start Single Quick Lottery Spin (1.1s)
  const runSingleLotterySpin = () => {
    const runners = getUniqueActiveRunners();
    if (runners.length === 0) {
      alert('추첨 대상 유저가 없습니다!');
      return;
    }

    setBottomSheetCollapsed(true);
    setIsRolling(true);
    setCommentary('🎰 룰렛 돌리는 중... 틱틱틱!');

    if (gameMode === 'podium') {
      const winnerIndex = Math.floor(Math.random() * runners.length);
      const winner = runners[winnerIndex];

      let startTime = Date.now();
      let duration = 1100;
      let currY = 0;

      function animate() {
        let elapsed = Date.now() - startTime;
        let progress = elapsed / duration;

        if (progress < 1) {
          let speed = Math.max(3, 40 * (1 - Math.pow(progress, 2)));
          currY -= speed;
          if (Math.abs(currY) > 1000) currY = 0;
          setReelY(currY);
          animRef.current = requestAnimationFrame(animate);
        } else {
          setIsRolling(false);
          setReelY(0);
          setReelWinners(winner);
          setCommentary(`🎉 [${winner.real_name || winner.name}] 님 당첨!`);

          // Mark user as done
          const nextWinners = [...pickedWinners, winner];
          setPickedWinners(nextWinners);
          setFeedbacks(prev => prev.map(f => ({
            ...f,
            users: f.users.map(u => u.id === winner.id ? { ...u, done: true } : u)
          })));

          setTimeout(() => {
            setCurrentSlide(2);
            setBottomSheetCollapsed(false);
          }, 800);
        }
      }
      animate();
    } else {
      // Group Dealer
      const shuffled = [...runners].sort(() => Math.random() - 0.5);
      const teams = Array.from({ length: teamCount }, () => []);
      shuffled.forEach((m, idx) => teams[idx % teamCount].push(m));

      setGroupTeams(teams);
      setCommentary('👥 무작위 조 구성 완료!');

      setTimeout(() => {
        setIsRolling(false);
        setCurrentSlide(2);
        setBottomSheetCollapsed(false);
      }, 900);
    }
  };

  // 📋 팀 구성 명단 복사 (사용자 지정 포맷: • 1팀: 찰리, 클라우디...)
  const handleCopyGroupResults = () => {
    if (!groupTeams || groupTeams.length === 0) return;
    const lines = groupTeams.map((team, idx) => {
      const names = team.map(m => m.real_name || m.name).join(', ');
      return `• ${idx + 1}팀: ${names}`;
    });
    const copyText = lines.join('\n');
    navigator.clipboard.writeText(copyText);
    alert('팀 구성 명단이 클립보드에 복사되었습니다!');
  };

  // 📋 1인/다인 당첨자 명단 복사 헬퍼
  const handleCopyWinners = () => {
    if (pickedWinners.length === 0) return;
    const names = pickedWinners.map((w, idx) => `${idx + 1}등: ${w.real_name || w.name}`).join('\n');
    navigator.clipboard.writeText(names);
    alert('당첨자 명단이 클립보드에 복사되었습니다!');
  };

  const activeRunners = getUniqueActiveRunners();

  return (
    <div className="meadow-canvas-full">
      {/* Top 2D Stage Viewport */}
      <div className="viewport-header">
        <h2>🎰 Slack Pick Studio</h2>
      </div>

      <div id="lottery-stage" className="lottery-stage">
        {gameMode === 'podium' ? (
          <div className="roulette-wrapper">
            <div className="target-line-2d">
              <span className="target-arrow">▶</span>
              <span className="target-arrow">◀</span>
            </div>

            <div
              className="roulette-reel-container"
              style={{ transform: `translateY(${reelY}px)` }}
            >
              {reelWinners ? (
                <div className="picker-card-2d winner-highlight">
                  <img src={reelWinners.avatar || 'https://via.placeholder.com/32'} className="card-avatar" alt="" />
                  <span className="card-name">🎉 {reelWinners.real_name || reelWinners.name}</span>
                </div>
              ) : activeRunners.length > 0 ? (
                activeRunners.map(u => (
                  <div key={u.id} className="picker-card-2d">
                    <img src={u.avatar || 'https://via.placeholder.com/32'} className="card-avatar" alt="" />
                    <span className="card-name">{u.real_name || u.name}</span>
                  </div>
                ))
              ) : (
                <div className="picker-card-2d empty-card">
                  <span className="card-avatar-text">🌱</span>
                  <span className="card-name">명단을 소환해 보세요!</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="group-dealer-stage">
            <div className="group-boxes-grid">
              {groupTeams && groupTeams.map((team, idx) => (
                <div key={idx} className="group-team-box">
                  <div className="team-title"><span>TEAM {idx + 1}</span> <span>{team.length}명</span></div>
                  <div className="team-members" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {team.map(m => (
                      <span key={m.id} className="group-member-pill">{m.real_name || m.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {commentary && (
          <div className="race-commentary-bar">
            <span>{commentary}</span>
          </div>
        )}
      </div>

      {/* Bottom Sheet Modal */}
      <div className={`bottom-sheet ${bottomSheetCollapsed ? 'collapsed' : ''}`}>
        <div className="bottom-sheet-handle" onClick={() => setBottomSheetCollapsed(!bottomSheetCollapsed)}>
          <div className="handle-bar"></div>
        </div>

        <div className="bottom-sheet-content">
          <div
            className="slider-wrapper"
            style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}
          >
            {/* Slide 0: Slack URL Input & Analysis */}
            <div className="slide-panel">
              <header className="panel-header">
                <div className="logo-row">
                  <span className="emoji-logo">🎰</span>
                  <h1>Slack Pick Studio</h1>
                </div>
                <p className="panel-subtitle">이모지 반응자를 분석해 룰렛 추첨에 소환해보세요.</p>
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
                    {loading ? '분석 중...' : '이모지 가져오기'}
                  </button>
                </form>
                {errorMsg && <div className="status-message">{errorMsg}</div>}
              </section>

              {analyzedMsg && (
                <section className="panel-card result-card">
                  <div className="message-info">
                    <div className="user-profile">
                      <img src={analyzedMsg.user.avatar || 'https://via.placeholder.com/40'} className="avatar" alt="" />
                      <div className="user-meta">
                        <span className="username">{analyzedMsg.user.real_name || analyzedMsg.user.name}</span>
                      </div>
                    </div>
                    <p className="message-content" dangerouslySetInnerHTML={{ __html: parseTextEmojis(analyzedMsg.text, customEmojis) }}></p>
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
                      <div className="emoji-filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '10px 0' }}>
                        {analyzedMsg.reactions && analyzedMsg.reactions.map(r => (
                          <div
                            key={r.name}
                            className={`emoji-chip ${selectedEmoji && selectedEmoji.name === r.name ? 'selected' : ''}`}
                            onClick={() => setSelectedEmoji(r)}
                          >
                            <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(r.name, customEmojis) }}></span>
                            <span> {r.count}</span>
                          </div>
                        ))}
                      </div>

                      {selectedEmoji && (
                        <div className="selected-emoji-detail">
                          <div className="emoji-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(selectedEmoji.name, customEmojis) }}></span>
                            <span>{selectedEmoji.users.length}명</span>
                            <button type="button" className="btn-success" onClick={handleAddToDrawList}>
                              추첨하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '10px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span>이모지 안 누른 미반응자 {unreactedUsers.length}명</span>
                        <button type="button" className="btn-success" onClick={handleSummonUnreacted}>
                          🎰 추첨기에 추가
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 유저별 이모지 현황 */}
                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      className="btn-secondary-outline"
                      onClick={() => setShowUserAnalysis(!showUserAnalysis)}
                    >
                      📊 유저별 이모지 반응 목록 보기
                    </button>

                    {showUserAnalysis && analyzedMsg.reactions && (
                      <div className="user-analysis-panel">
                        {analyzedMsg.reactions.map(r => (
                          <div key={r.name} style={{ fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #eee' }}>
                            <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(r.name, customEmojis) }}></span>
                            <span> : {r.users.map(u => u.real_name || u.name).join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Slide 1: Feedback / Draw List & Config */}
            <div className="slide-panel">
              <header className="slide-header-nav">
                <button type="button" className="btn-prev-slide" onClick={() => setCurrentSlide(0)}>
                  ⬅️ 뒤로가기
                </button>
              </header>

              <section className="panel-card feedback-card">
                <div className="feedback-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>추첨 명단</h3>
                  <button type="button" className="btn-action-xs btn-danger-xs" onClick={handleDeleteAllRunners}>
                    전체삭제
                  </button>
                </div>

                <div className="game-mode-panel">
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
                        name="mode"
                        checked={gameMode === 'podium'}
                        onChange={() => setGameMode('podium')}
                      />
                      <span className="mode-tab-btn">🏆 무작위 추첨</span>
                    </label>
                    <label className="mode-tab-label">
                      <input
                        type="radio"
                        name="mode"
                        checked={gameMode === 'group'}
                        onChange={() => setGameMode('group')}
                      />
                      <span className="mode-tab-btn">👥 조 짜기</span>
                    </label>
                  </div>
                </div>

                {/* Draw List */}
                <div style={{ margin: '12px 0' }}>
                  {feedbacks.length === 0 ? (
                    <p className="empty-text">소환된 유저가 없습니다. 슬랙 메시지를 분석해 추첨을 시작해 보세요!</p>
                  ) : (
                    feedbacks.map(f => (
                      <div key={f.emoji} className="feedback-group-item" style={{ background: '#f5f5f7', padding: '8px', borderRadius: '10px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '13px' }}>
                          <span dangerouslySetInnerHTML={{ __html: renderEmojiIcon(f.emoji, customEmojis) + ` (${f.users.length}명)` }}></span>
                          <button type="button" className="btn-danger-xs" onClick={() => handleDeleteFeedback(f.messageLink, f.emoji)}>삭제</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {feedbacks.length > 0 && (
                  <button type="button" className="btn-primary" onClick={runSingleLotterySpin}>
                    🎰 {gameMode === 'podium' ? '추첨 시작!' : '팀 나누기!'}
                  </button>
                )}
              </section>
            </div>

            {/* Slide 2: Final Result View */}
            <div className="slide-panel">
              <section className="panel-card result-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>🎉 추첨 결과</h3>
                  {gameMode === 'group' ? (
                    groupTeams && (
                      <button type="button" className="btn-success-sm" onClick={handleCopyGroupResults}>
                        📋 팀 구성 명단 복사
                      </button>
                    )
                  ) : (
                    pickedWinners.length > 0 && (
                      <button type="button" className="btn-success-sm" onClick={handleCopyWinners}>
                        📋 당첨자 복사
                      </button>
                    )
                  )}
                </div>

                {gameMode === 'podium' ? (
                  <div className="ranking-list-view">
                    {pickedWinners.map((w, idx) => (
                      <div key={w.id} className="winner-result-card">
                        <span className="winner-rank-badge">{idx + 1}등</span>
                        <img src={w.avatar || 'https://via.placeholder.com/44'} className="winner-avatar" alt="" />
                        <div className="winner-info">
                          <div className="name">{w.real_name || w.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>🎉 축하합니다!</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="group-ranking-view">
                    {groupTeams && groupTeams.map((team, tIdx) => (
                      <div key={tIdx} className="panel-card" style={{ textStyle: 'left', marginBottom: '8px' }}>
                        <h4 style={{ color: '#4f46e5', marginBottom: '6px' }}>TEAM {tIdx + 1} ({team.length}명)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {team.map(m => (
                            <span key={m.id} className="group-member-pill">{m.real_name || m.name}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={gameMode === 'podium' && activeRunners.length === 0}
                    onClick={() => {
                      if (gameMode === 'podium' && activeRunners.length > 0) {
                        runSingleLotterySpin();
                      } else {
                        setCurrentSlide(1);
                      }
                    }}
                  >
                    🎰 {gameMode === 'podium' ? `다음 당첨자 뽑기 (남은 ${activeRunners.length}명)` : '다시 조 짜기'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-outline"
                    onClick={() => {
                      setPickedWinners([]);
                      setCurrentSlide(0);
                      setBottomSheetCollapsed(true);
                      setReelWinners(null);
                    }}
                  >
                    확정 및 닫기
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
