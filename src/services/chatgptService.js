export const generateSummary = async (fecha, mañana, tarde, noche) => {
  try {
    const payload = { fecha, manana: mañana || "", tarde: tarde || "", noche: noche || "" };
    const resp = await fetch("/generateSummary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Error HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.resumen || "";
  } catch (error) {
    throw new Error(error.message || "No se pudo generar el resumen");
  }
}; 