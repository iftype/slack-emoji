const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS 설정 (GitHub Pages에서 API 호출 허용)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://iftype.github.io',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

const CONFIG_PATH = path.join(__dirname, 'config.json');
const FEEDBACKS_PATH = path.join(__dirname, 'feedbacks.json');

// 사용자 정보 캐시
const userCache = new Map();

// 설정 정보 로드 및 쓰기 헬퍼
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load config.json:', err.message);
  }
  return { token: '', cookie: '' };
}

// 환경변수에서 토큰 로드 (서버 배포 시 .env 파일에서 읽음)
function getServerToken() {
  return process.env.SLACK_TOKEN || null;
}
function getServerCookie() {
  return process.env.SLACK_COOKIE || '';
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save config.json:', err.message);
    return false;
  }
}

// 피드백 정보 로드 및 쓰기 헬퍼
function loadFeedbacks() {
  try {
    if (fs.existsSync(FEEDBACKS_PATH)) {
      const data = fs.readFileSync(FEEDBACKS_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load feedbacks.json:', err.message);
  }
  return [];
}

function saveFeedbacks(feedbacks) {
  try {
    fs.writeFileSync(FEEDBACKS_PATH, JSON.stringify(feedbacks, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save feedbacks.json:', err.message);
    return false;
  }
}

// 슬랙 URL 파싱 헬퍼
function parseSlackUrl(url) {
  try {
    const regex = /\/archives\/([A-Z0-9]+)\/p(\d+)/;
    const match = url.match(regex);
    if (!match) return null;
    
    const channelId = match[1];
    const rawTs = match[2];
    
    let timestamp;
    if (rawTs.length > 10) {
      timestamp = rawTs.slice(0, 10) + '.' + rawTs.slice(10);
    } else {
      timestamp = rawTs;
    }
    
    return { channelId, timestamp };
  } catch (error) {
    return null;
  }
}

// 특정 사용자의 상세 정보 조회 헬퍼
async function getUserInfo(userId, token, cookieD = '') {
  const cacheKey = `${userId}_${token}`;
  if (userCache.has(cacheKey)) {
    return userCache.get(cacheKey);
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    if (cookieD) {
      headers['Cookie'] = `d=${cookieD}`;
    }

    const response = await axios.get('https://slack.com/api/users.info', {
      headers,
      params: { user: userId }
    });

    if (response.data.ok) {
      const user = response.data.user;
      const userInfo = {
        id: userId,
        name: user.name,
        real_name: user.profile.real_name || user.real_name,
        display_name: user.profile.display_name || '',
        avatar: user.profile.image_72 || user.profile.image_48 || '',
        is_bot: user.is_bot || user.is_app_user || false
      };
      userCache.set(cacheKey, userInfo);
      return userInfo;
    }
  } catch (err) {
    console.error(`Failed to fetch user info for ${userId}:`, err.message);
  }

  return {
    id: userId,
    name: userId,
    real_name: `User (${userId})`,
    display_name: '',
    avatar: ''
  };
}

/* ====================================================
   API 라우트 설계
   ==================================================== */

// [로그인 검증 API] — 서버 토큰 전용 (클라이언트 토큰 미사용)
app.post('/api/login', async (req, res) => {
  const token = getServerToken();
  const cookie = getServerCookie();
  if (!token) {
    return res.status(503).json({ ok: false, error: '서버에 SLACK_TOKEN이 설정되지 않았습니다.' });
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    if (cookie) {
      headers['Cookie'] = `d=${cookie}`;
    }

    const response = await axios.post('https://slack.com/api/auth.test', {}, { headers });

    if (response.data.ok) {
      return res.json({
        ok: true,
        user: response.data.user,
        team: response.data.team,
        url: response.data.url
      });
    } else {
      return res.status(401).json({ ok: false, error: `슬랙 인증 실패: ${response.data.error}` });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: `서버 통신 실패: ${err.message}` });
  }
});

// [커스텀 이모지 목록 가져오기 API]
app.post('/api/emojis', async (req, res) => {
  const token = getServerToken();
  const cookie = getServerCookie();
  if (!token) {
    return res.status(503).json({ ok: false, error: '서버에 SLACK_TOKEN이 설정되지 않았습니다.' });
  }

  try {
    const headers = { Authorization: `Bearer ${token}` };
    if (cookie) {
      headers['Cookie'] = `d=${cookie}`;
    }

    const response = await axios.get('https://slack.com/api/emoji.list', { headers });
    if (response.data.ok) {
      return res.json({ ok: true, emoji: response.data.emoji || {} });
    } else {
      return res.status(400).json({ ok: false, error: `이모지 리스트 로드 실패: ${response.data.error}` });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// [분석 API]
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  const token = getServerToken();
  const cookie = getServerCookie();

  if (!token) {
    return res.status(503).json({ ok: false, error: '서버에 SLACK_TOKEN이 설정되지 않았습니다.' });
  }

  if (!url) {
    return res.status(400).json({ ok: false, error: '슬랙 메시지 링크가 필요합니다.' });
  }

  if (token.startsWith('xoxc-') && !cookie) {
    return res.status(400).json({ ok: false, error: 'xoxc- 토큰을 쓰려면 SLACK_COOKIE 환경변수가 필요합니다.' });
  }

  const parsed = parseSlackUrl(url);
  if (!parsed) {
    return res.status(400).json({ ok: false, error: '유효한 슬랙 메시지 링크 형식이 아닙니다.' });
  }

  const { channelId, timestamp } = parsed;

  try {
    const headers = { Authorization: `Bearer ${token}` };
    if (cookie) {
      headers['Cookie'] = `d=${cookie}`;
    }

    const response = await axios.get('https://slack.com/api/reactions.get', {
      headers,
      params: {
        channel: channelId,
        timestamp: timestamp,
        full: true
      }
    });

    if (!response.data.ok) {
      const slackError = response.data.error;
      let userFriendlyError = `슬랙 API 에러: ${slackError}`;
      
      if (slackError === 'invalid_auth') {
        userFriendlyError = '슬랙 인증 세션이 만료되었습니다. 서버 토큰을 확인해 주세요.';
      } else if (slackError === 'channel_not_found') {
        userFriendlyError = '채널을 찾을 수 없거나 접근 권한이 없습니다. (해당 채널에 토큰 계정이 가입되어 있어야 합니다.)';
      }
      
      return res.status(400).json({ ok: false, error: userFriendlyError });
    }

    const messageData = response.data.message;
    const reactions = messageData.reactions || [];
    
    // 고유 사용자 ID 목록 수집
    const userIds = new Set();
    reactions.forEach(r => {
      if (r.users) {
        r.users.forEach(uid => userIds.add(uid));
      }
    });

    // 사용자 정보 병렬 로드
    const userMap = {};
    const userInfoPromises = Array.from(userIds).map(async (uid) => {
      const info = await getUserInfo(uid, token, cookie);
      userMap[uid] = info;
    });
    await Promise.all(userInfoPromises);

    const analyzedReactions = reactions.map(r => ({
      name: r.name,
      count: r.count,
      users: (r.users || []).map(uid => userMap[uid] || { id: uid, real_name: uid, avatar: '' })
    }));

    let messageAuthor = { id: messageData.user, real_name: messageData.user, avatar: '' };
    if (messageData.user) {
      messageAuthor = await getUserInfo(messageData.user, token, cookie);
    }

    // 🚨 슬랙 채널 내부 멤버 중 반응(이모지)을 안 누른 유저 탐지
    let unreactedUsers = [];
    try {
      const membersRes = await axios.get('https://slack.com/api/conversations.members', {
        headers,
        params: { channel: channelId, limit: 1000 }
      });
      if (membersRes.data.ok && Array.isArray(membersRes.data.members)) {
        const allChannelMembers = membersRes.data.members;
        const unreactedMemberIds = allChannelMembers.filter(id => !userIds.has(id));
        
        // 상위 100명까지 병렬 정보 로드 및 봇 제외
        const unreactedPromises = unreactedMemberIds.slice(0, 100).map(async (uid) => {
          const info = await getUserInfo(uid, token, cookie);
          return info.is_bot ? null : info;
        });
        const unreactedResults = await Promise.all(unreactedPromises);
        unreactedUsers = unreactedResults.filter(Boolean);
      }
    } catch (mErr) {
      console.warn('Channel members fetch skipped/failed:', mErr.message);
    }

    return res.json({
      ok: true,
      message: {
        text: messageData.text || '',
        user: messageAuthor,
        ts: messageData.ts,
        reactions: analyzedReactions,
        unreactedUsers: unreactedUsers,
        channel: channelId
      }
    });

  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return res.status(500).json({ ok: false, error: `서버 통신 중 오류 발생: ${error.message}` });
  }
});

// [피드백 관리 API]
app.get('/api/feedbacks', (req, res) => {
  res.json({ ok: true, feedbacks: loadFeedbacks() });
});

app.post('/api/feedbacks', (req, res) => {
  const { messageLink, emoji, users, messageText } = req.body;
  if (!messageLink || !emoji || !users) {
    return res.status(400).json({ ok: false, error: '필수 데이터가 유실되었습니다.' });
  }

  const feedbacks = loadFeedbacks();
  const existIndex = feedbacks.findIndex(f => f.messageLink === messageLink && f.emoji === emoji);

  const formattedUsers = users.map(u => ({
    id: u.id,
    name: u.name || u.id,
    real_name: u.real_name,
    display_name: u.display_name || '',
    avatar: u.avatar,
    done: false,
    memo: '',  // 개별 메모 초기화
    link: ''   // 개별 링크 초기화
  }));

  if (existIndex > -1) {
    feedbacks[existIndex].users = formattedUsers;
  } else {
    feedbacks.push({
      messageLink,
      messageText: messageText || '',
      emoji,
      createdAt: new Date().toISOString(),
      users: formattedUsers
    });
  }

  saveFeedbacks(feedbacks);
  res.json({ ok: true, feedbacks });
});

// 피드백 내 유저 체크 토글
app.patch('/api/feedbacks/user', (req, res) => {
  const { messageLink, emoji, userId, done } = req.body;
  if (!messageLink || !emoji || !userId) {
    return res.status(400).json({ ok: false, error: '필수 데이터가 부족합니다.' });
  }

  const feedbacks = loadFeedbacks();
  const feedback = feedbacks.find(f => f.messageLink === messageLink && f.emoji === emoji);

  if (!feedback) {
    return res.status(404).json({ ok: false, error: '피드백 대상을 찾을 수 없습니다.' });
  }

  const user = feedback.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ ok: false, error: '사용자를 찾을 수 없습니다.' });
  }

  user.done = done;

  saveFeedbacks(feedbacks);
  res.json({ ok: true, feedbacks });
});

// 🎯 피드백 대기 유저의 개별 메모 및 링크 저장 API 구현
app.patch('/api/feedbacks/user/meta', (req, res) => {
  const { messageLink, emoji, userId, memo, link } = req.body;
  if (!messageLink || !emoji || !userId) {
    return res.status(400).json({ ok: false, error: '필수 데이터가 누락되었습니다.' });
  }

  const feedbacks = loadFeedbacks();
  const feedback = feedbacks.find(f => f.messageLink === messageLink && f.emoji === emoji);

  if (!feedback) {
    return res.status(404).json({ ok: false, error: '피드백 대상을 찾을 수 없습니다.' });
  }

  const user = feedback.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ ok: false, error: '사용자를 찾을 수 없습니다.' });
  }

  // 데이터 갱신
  if (memo !== undefined) user.memo = memo;
  if (link !== undefined) user.link = link;

  saveFeedbacks(feedbacks);
  res.json({ ok: true, feedbacks });
});

app.delete('/api/feedbacks', (req, res) => {
  const { messageLink, emoji } = req.body;
  let feedbacks = loadFeedbacks();
  feedbacks = feedbacks.filter(f => !(f.messageLink === messageLink && f.emoji === emoji));
  saveFeedbacks(feedbacks);
  res.json({ ok: true, feedbacks });
});

// 서버 토큰 설정 여부 확인 API
app.get('/api/server-token-status', (req, res) => {
  res.json({ ok: true, hasServerToken: !!getServerToken() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
