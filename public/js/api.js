// Slack Meadow API Service Module

function getApiBase() {
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    return ''; // 로컬 개발
  }
  return 'https://iftype.store/slack'; // 프로덕션 오라클 서버
}

const SlackApi = {
  async checkServerTokenStatus() {
    try {
      const res = await fetch(`${getApiBase()}/api/server-token-status`);
      const data = await res.json();
      return data.hasServerToken;
    } catch (e) {
      return false;
    }
  },

  async fetchCustomEmojis() {
    try {
      const res = await fetch(`${getApiBase()}/api/emojis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      return (res.ok && data.ok) ? (data.emoji || {}) : {};
    } catch (e) {
      return {};
    }
  },

  async analyzeSlackUrl(url) {
    const res = await fetch(`${getApiBase()}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || '슬랙 이모지 정보를 가져오는데 실패했습니다.');
    }
    return data.message;
  },

  async fetchFeedbacks() {
    try {
      const res = await fetch(`${getApiBase()}/api/feedbacks`);
      const data = await res.json();
      return (data.ok) ? data.feedbacks : [];
    } catch (e) {
      return [];
    }
  },

  async saveFeedbackGroup(messageLink, messageText, emojiName, users) {
    const res = await fetch(`${getApiBase()}/api/feedbacks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageLink: messageLink || 'Custom Group',
        messageText: messageText || '',
        emoji: emojiName,
        users: users
      })
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || '소환 저장 실패');
    }
    return data.feedbacks;
  },

  async deleteFeedbackGroup(messageLink, emojiName) {
    const res = await fetch(`${getApiBase()}/api/feedbacks`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageLink, emoji: emojiName })
    });
    const data = await res.json();
    return data.ok ? data.feedbacks : [];
  }
};
