const lastMsg = {};

export function rateLimit(user) {
  const now = Date.now();
  if (lastMsg[user] && now - lastMsg[user] < 3000)
    return false;

  lastMsg[user] = now;
  return true;
}
