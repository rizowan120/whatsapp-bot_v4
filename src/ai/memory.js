export const sessions = {};
export const userModels = {};

export function getSession(user) {
  if (!sessions[user]) {
    sessions[user] = { messages: [], summary: "" };
  }
  return sessions[user];
}

export function getUserModel(user) {
  return userModels[user] || "llama-3.3-70b";
}

export function setUserModel(user, model) {
  userModels[user] = model;
}
