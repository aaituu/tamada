const API_URL = "/api";

function getToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function setToken(token, useSession = false) {
  if (useSession) sessionStorage.setItem("token", token);
  else localStorage.setItem("token", token);
}

function removeToken() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
}

async function verifyToken() {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function fetchProfile() {
  const token = getToken();
  if (!token) throw new Error("no-token");
  const res = await fetch(`${API_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("unauthorized");
  const data = await res.json();
  return data.user;
}

window.authHelpers = {
  getToken,
  setToken,
  removeToken,
  verifyToken,
  fetchProfile,
};
