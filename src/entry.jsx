import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";

// localStorage-backed replacement for the Claude artifact storage API.
// DO NOT change the "mailday:" namespace or keys — existing users' saved
// progress lives under these exact keys.
const NS = "mailday:";
window.storage = {
  async get(key) {
    const v = localStorage.getItem(NS + key);
    if (v == null) throw new Error("key not found");
    return { key, value: v, shared: false };
  },
  async set(key, value) {
    localStorage.setItem(NS + key, value);
    return { key, value, shared: false };
  },
  async delete(key) {
    localStorage.removeItem(NS + key);
    return { key, deleted: true, shared: false };
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(NS) && k.slice(NS.length).startsWith(prefix))
        keys.push(k.slice(NS.length));
    }
    return { keys, prefix, shared: false };
  },
};

createRoot(document.getElementById("root")).render(<App />);
