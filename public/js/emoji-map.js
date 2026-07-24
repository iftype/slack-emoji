// 슬랙 대표 이모지 숏코드 -> 유니코드 매핑 딕셔너리
const EMOJI_MAP = {
  // 슬랙 대표 기본 반응 이모지
  'thumbsup': '👍', '+1': '👍', 'thumbsdown': '👎', '-1': '👎',
  'heart': '❤️', 'sparkling_heart': '💖', 'green_heart': '💚', 'yellow_heart': '💛', 'purple_heart': '💜', 'blue_heart': '💙',
  'smile': '😄', 'laughing': '😆', 'satisfied': '😆', 'grinning': '😀', 'smiley': '😃', 'sweat_smile': '😅', 'rofl': '🤣', 'rolling_on_the_floor_laughing': '🤣', 'joy': '😂',
  'wink': '😜', 'blush': '😊', 'innocent': '😇', 'heart_eyes': '😍', 'kissing_heart': '😘', 'sunglasses': '😎', 'smirk': '😏',
  'thinking_face': '🤔', 'thinking': '🤔', 'neutral_face': '😐', 'expressionless': '😑', 'unamused': '😒', 'face_with_rolling_eyes': '🙄',
  'grimacing': '😬', 'lying_face': '🤥', 'relieved': '😌', 'pensive': '😔', 'sleepy': '😪', 'drooling_face': '🤤', 'sleeping': '😴',
  'mask': '😷', 'face_with_thermometer': '🤒', 'face_with_head_bandage': '🤕', 'nauseated_face': '🤢', 'sneezing_face': '🤧',
  'dizzy_face': '😵', 'cowboy_hat_face': '🤠', 'clown_face': '🤡',
  'shushing_face': '🤫', 'face_with_hand_over_mouth': '🤭', 'exploding_head': '🤯', 'zany_face': '🤪', 'money_mouth_face': '🤑',
  
  // 손동작 & 사람
  'pray': '🙏', 'raised_hands': '🙌', 'clap': '👏', 'wave': '👋', 'ok_hand': '👌', 'v': '✌️', 'crossed_fingers': '🤞', 'metal': '🤘',
  'call_me_hand': '🤙', 'point_left': '👈', 'point_right': '👉', 'point_up': '👆', 'point_up_2': '👆', 'point_down': '👇', 'fu': '🖕',
  'raised_back_of_hand': '🤚', 'fist': '✊', 'fist_raised': '✊', 'fist_oncoming': '👊', 'punch': '👊', 'raised_hand': '✋', 'hand': '✋',
  'muscle': '💪', 'brain': '🧠', 'eyes': '👀', 'ear': '👂', 'nose': '👃',

  // 기호, 질문, 상태 (캡처 `:question:` 해결!)
  'question': '❓', 'grey_question': '👵', 'white_question': '👵',
  'exclamation': '❗️', 'heavy_exclamation_mark': '❗️', 'grey_exclamation': '❕',
  'interrobang': '⁉️', 'speech_balloon': '💬', 'thought_balloon': '💭',
  'check': '✅', 'white_check_mark': '✅', 'heavy_check_mark': '✔️', 'ballot_box_with_check': '☑️',
  'x': '❌', 'negative_squared_cross_mark': '❎', 'cross_mark': '❌',
  'warning': '⚠️', 'no_entry': '⛔', 'no_entry_sign': '🚫', 'heavy_plus_sign': '➕', 'heavy_minus_sign': '➖', 'heavy_division_sign': '➗',
  '100': '💯', 'zap': '⚡', 'fire': '🔥', 'sparkles': '✨', 'star': '⭐', 'star2': '🌟', 'dizzy': '💫', 'boom': '💥', 'collision': '💥',
  'anger': '💢', 'sweat_drops': '💦', 'droplet': '💧', 'dash': '💨', 'poop': '💩',

  // 축하 및 사물
  'party_popper': '🎉', 'tada': '🎉', 'confetti_ball': '🎊', 'balloon': '🎈', 'gift': '🎁', 'ribbon': '🎀', 'trophy': '🏆',
  'first_place_medal': '🥇', 'second_place_medal': '🥈', 'third_place_medal': '🥉', 'medal': '🏅', 'sports_medal': '🏅',
  'crown': '👑', 'lightbulb': '💡', 'rocket': '🚀', 'clinking_glasses': '🥂', 'beer': '🍺', 'beers': '🍻', 'pizza': '🍕', 'coffee': '☕',
  
  // 숫자
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
