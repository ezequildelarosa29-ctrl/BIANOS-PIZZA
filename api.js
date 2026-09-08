// ============================================================
// BIANO'S PIZZA - API CLIENT
// ============================================================
"use strict";

const API_URL = "https://script.google.com/macros/s/AKfycbzxcoS4qMl5gx_CKGlpjx-zVFZ8D-uftZW4QDMdzM7WiNyU_nS9WVm5pdPSV_NwN5mWOQ/exec";

async function apiCall(action, payload = {}, redirectOnInvalidSession = true) {
  const token = localStorage.getItem("bianos_token") || "";
  const body = { action, token, ...payload };

  console.log("[Biano's Pizza API]", action, body);

  let res;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.error("[Biano's Pizza API] Network error", err);
    throw new Error("Cannot connect to Biano's Pizza server. Check the Apps Script Web App URL and deployment.");
  }

  const raw = await res.text();
  console.log("[Biano's Pizza API] HTTP", res.status, raw);

  if (!res.ok) {
    throw new Error("Server returned HTTP " + res.status + ".");
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error("[Biano's Pizza API] Invalid JSON:", raw);
    throw new Error("The Biano's Pizza server returned an invalid response.");
  }

  if (data && data.error === "invalid_session" && redirectOnInvalidSession) {
    localStorage.removeItem("bianos_token");
    localStorage.removeItem("bianos_role");
    localStorage.removeItem("bianos_username");
    window.location.href = "index.html";
    return data;
  }

  return data;
}
