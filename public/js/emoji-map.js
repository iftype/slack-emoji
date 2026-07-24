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
  'x': '❌', 'heavy_check_mark': '✔️', 'heavy_plus_sign': '➕',
  'wave': '👋', 'ok_hand': '👌', 'v': '✌️', 'muscle': '💪', 'brain': '🧠',
  'zero': '0️⃣', 'one': '1️⃣', 'two': '2️⃣', 'three': '3️⃣', 'four': '4️⃣',
  'five': '5️⃣', 'six': '6️⃣', 'seven': '7️⃣', 'eight': '8️⃣', 'nine': '9️⃣',
  'keycap_ten': '🔟', '1234': '🔢'
};

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

function renderEmojiIcon(name, customEmojiCache = {}) {
  if (!name) return '';
  if (EMOJI_MAP[name]) return EMOJI_MAP[name];
  if (customEmojiCache && customEmojiCache[name]) {
    const imgUrl = customEmojiCache[name];
    if (imgUrl && typeof imgUrl === 'string' && !imgUrl.startsWith('alias:')) {
      return `<img src="${imgUrl}" style="width:18px;height:18px;vertical-align:middle;border-radius:3px;">`;
    }
  }
  return `:${name}:`;
}

// 👤 슬랙 유저 닉네임 1순위 반환 헬퍼 (채널 닉네임 display_name > real_name > name)
function getUserDisplayName(u) {
  if (!u) return '';
  return u.display_name || u.real_name || u.name || '사용자';
}
