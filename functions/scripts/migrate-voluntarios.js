const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const DRY_RUN = process.env.DRY_RUN !== "false";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const volunteerDocId = (email) => encodeURIComponent(normalizeEmail(email));

function mergeDocData(existing, current) {
  const existingTokens = Array.isArray(existing.tokens) ? existing.tokens : [];
  const currentTokens = Array.isArray(current.tokens) ? current.tokens : [];
  const tokenSet = new Set();

  [...existingTokens, ...currentTokens].forEach((token) => {
    if (typeof token === "string" && token.trim()) tokenSet.add(token);
  });

  const existingEnabled = existing.notificationsEnabled;
  const currentEnabled = current.notificationsEnabled;
  const notificationsEnabled = existingEnabled === true || currentEnabled === true
    ? true
    : existingEnabled === false && currentEnabled === false
      ? false
      : existingEnabled ?? currentEnabled ?? false;

  const createdAt = existing.createdAt || current.createdAt || admin.firestore.FieldValue.serverTimestamp();
  return {
    ...existing,
    ...current,
    email: normalizeEmail(current.email || existing.email),
    notificationsEnabled,
    tokens: Array.from(tokenSet),
    createdAt,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function run() {
  const snap = await db.collection("voluntarios").get();
  const groups = new Map();

  snap.forEach((docSnap) => {
    const data = docSnap.data() || {};
    const email = normalizeEmail(data.email);
    if (!email) return;
    const group = groups.get(email) || [];
    group.push({ id: docSnap.id, ref: docSnap.ref, data });
    groups.set(email, group);
  });

  let mergedUsers = 0;
  let removedLegacyDocs = 0;
  let touchedDocs = 0;

  for (const [email, docs] of groups.entries()) {
    const canonicalId = volunteerDocId(email);
    const canonicalRef = db.collection("voluntarios").doc(canonicalId);

    let merged = {};
    for (const item of docs) {
      merged = mergeDocData(merged, item.data);
    }

    if (DRY_RUN) {
      console.log(`[DRY_RUN] Upsert ${canonicalId} from ${docs.length} doc(s)`);
      docs.forEach((item) => {
        if (item.id !== canonicalId) {
          console.log(`  [DRY_RUN] Delete legacy doc ${item.id}`);
          removedLegacyDocs += 1;
        }
      });
      mergedUsers += 1;
      continue;
    }

    const batch = db.batch();
    batch.set(canonicalRef, merged, { merge: true });
    touchedDocs += 1;

    docs.forEach((item) => {
      if (item.id !== canonicalId) {
        batch.delete(item.ref);
        touchedDocs += 1;
        removedLegacyDocs += 1;
      }
    });

    await batch.commit();
    mergedUsers += 1;
  }

  console.log(`Usuarios procesados: ${mergedUsers}`);
  console.log(`Docs legacy a borrar/borrados: ${removedLegacyDocs}`);
  if (!DRY_RUN) {
    console.log(`Operaciones aplicadas: ${touchedDocs}`);
  } else {
    console.log("No se aplicaron cambios (DRY_RUN=true).");
  }
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error migrando voluntarios:", error);
    process.exit(1);
  });
