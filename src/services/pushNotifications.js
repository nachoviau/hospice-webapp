import { arrayUnion, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app, db } from "../firebaseConfig";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;
const ANONYMOUS_USER = "usuario_anonimo";
let foregroundListenerAttached = false;
const DEBUG_ENDPOINT = "http://127.0.0.1:7743/ingest/136de172-a44a-448e-9b04-ebc073f3f1c6";
const DEBUG_SESSION_ID = "baf670";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();
const volunteerDocId = (email) => encodeURIComponent(normalizeEmail(email));

function sendDebugLog(hypothesisId, location, message, data = {}) {
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": DEBUG_SESSION_ID,
    },
    body: JSON.stringify({
      sessionId: DEBUG_SESSION_ID,
      runId: "run-initial",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
}

async function updateNotificationPreference(email, enabled) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized === ANONYMOUS_USER) return;
  await setDoc(
    doc(db, "voluntarios", volunteerDocId(normalized)),
    {
      email: normalized,
      notificationsEnabled: enabled,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

async function updateNotificationDebug(email, debugPatch) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized === ANONYMOUS_USER) return;
  await setDoc(
    doc(db, "voluntarios", volunteerDocId(normalized)),
    {
      email: normalized,
      notificationDebug: {
        ...debugPatch,
        at: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function attachForegroundNotificationHandler(messaging) {
  if (foregroundListenerAttached) return;
  foregroundListenerAttached = true;

  onMessage(messaging, (payload) => {
    const title = payload?.data?.title || payload?.notification?.title;
    const body = payload?.data?.body || payload?.notification?.body;
    const url = payload?.data?.url || "/partes";

    if (!title || Notification.permission !== "granted") return;

    const notification = new Notification(title, { body, data: { url } });
    notification.onclick = () => {
      window.focus();
      window.location.assign(url);
    };
  });
}

export async function bootstrapPushNotifications(email) {
  const normalized = normalizeEmail(email);
  sendDebugLog("H1", "pushNotifications.js:75", "bootstrap-start", {
    hasEmail: !!normalized,
    isAnonymous: normalized === ANONYMOUS_USER,
    notificationPermission: typeof Notification !== "undefined" ? Notification.permission : "unavailable",
    hasServiceWorkerApi: typeof navigator !== "undefined" && "serviceWorker" in navigator,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  });
  if (!normalized || normalized === ANONYMOUS_USER) return;
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const supported = await isSupported().catch(() => false);
  sendDebugLog("H2", "pushNotifications.js:86", "isSupported-result", { supported });
  if (!supported) {
    await updateNotificationDebug(normalized, {
      status: "unsupported-browser",
      permission: Notification.permission || "unknown",
    });
    return;
  }
  if (!VAPID_KEY) {
    console.warn("VITE_FIREBASE_VAPID_KEY no está configurada; push deshabilitado.");
    await updateNotificationDebug(normalized, {
      status: "missing-vapid-key",
      permission: Notification.permission || "unknown",
    });
    return;
  }

  const messaging = getMessaging(app);
  attachForegroundNotificationHandler(messaging);

  sendDebugLog("H3", "pushNotifications.js:100", "permission-before-request", {
    currentPermission: Notification.permission,
  });
  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  sendDebugLog("H3", "pushNotifications.js:106", "permission-after-request", {
    permission,
  });

  if (permission !== "granted") {
    await updateNotificationPreference(normalized, false);
    await updateNotificationDebug(normalized, {
      status: "permission-not-granted",
      permission,
    });
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    sendDebugLog("H4", "pushNotifications.js:120", "sw-ready", {
      hasActive: !!registration?.active,
      hasWaiting: !!registration?.waiting,
      hasInstalling: !!registration?.installing,
      scope: registration?.scope || "unknown",
    });
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    sendDebugLog("H5", "pushNotifications.js:128", "getToken-result", {
      tokenPresent: !!token,
      tokenLength: token ? token.length : 0,
    });

    if (!token) {
      await updateNotificationPreference(normalized, false);
      await updateNotificationDebug(normalized, {
        status: "empty-token",
        permission,
      });
      return;
    }

    await setDoc(
      doc(db, "voluntarios", volunteerDocId(normalized)),
      {
        email: normalized,
        notificationsEnabled: true,
        tokens: arrayUnion(token),
        notificationDebug: {
          status: "token-ok",
          permission,
          at: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    sendDebugLog("H5", "pushNotifications.js:150", "token-saved", {
      notificationsEnabled: true,
      tokenPresent: true,
    });
  } catch (error) {
    sendDebugLog("H5", "pushNotifications.js:155", "getToken-error", {
      name: error?.name || "unknown",
      message: error?.message || String(error),
      code: error?.code || "unknown",
      permission,
    });
    await updateNotificationPreference(normalized, false);
    await updateNotificationDebug(normalized, {
      status: "token-error",
      permission,
      message: error?.message || String(error),
      name: error?.name || "unknown",
      code: error?.code || "unknown",
    });
  }
}
