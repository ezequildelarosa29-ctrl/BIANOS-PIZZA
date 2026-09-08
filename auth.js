"use strict";

function requireLogin() {
  const token = localStorage.getItem("bianos_token");
  if (!token) {
    window.location.href = "index.html";
    return null;
  }
  return {
    token,
    role: localStorage.getItem("bianos_role") || "",
    username: localStorage.getItem("bianos_username") || ""
  };
}

function requireAdmin(user) {
  if (!user || String(user.role).toLowerCase() !== "admin") {
    alert("Administrator access only.");
    window.location.href = "dashboard.html";
    return false;
  }
  return true;
}

async function doLogout() {
  try { await apiCall("logout", {}, false); } catch (e) { console.warn(e); }
  localStorage.removeItem("bianos_token");
  localStorage.removeItem("bianos_role");
  localStorage.removeItem("bianos_username");
  sessionStorage.removeItem("bianos_pending_userid");
  window.location.href = "index.html";
}
