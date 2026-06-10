const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "MODEX-7 Proxy online", version: "1.2.0" });
});

app.get("/api/test", async (req, res) => {
  try {
    const r = await fetch("https://swgoh.gg/api/", {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MODEX7/1.0)", "Accept": "application/json" },
    });
    res.json({ ok: r.ok, status: r.status, reachable: true });
  } catch (err) {
    res.json({ ok: false, reachable: false, error: err.message });
  }
});

app.get("/api/mods/:allyCode", async (req, res) => {
  const code = String(req.params.allyCode).replace(/[-\s]/g, "");
  if (!code || code.length < 9) return res.status(400).json({ error: "Invalid ally code." });
  try {
    const r = await fetch(`https://swgoh.gg/api/player/${code}/?include=units`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!r.ok) {
      return res.status(r.status).json({
        error: `swgoh.gg returned ${r.status}`,
        hint: r.status === 404 ? "Player not found — check ally code" : "swgoh.gg error",
      });
    }
    const data = await r.json();
    const playerName = data?.data?.name || data?.name || "Unknown";
    const gp = data?.data?.galactic_power || data?.galactic_power || 0;
    const guildName = data?.data?.guild_name || data?.guild_name || null;
    const unitList = data?.units || data?.data?.units || data?.rosterUnit || [];
    const mods = [];
    const characters = [];
    unitList.forEach((unit) => {
      const name = unit?.data?.name || unit?.name || unit?.definitionId || "Unknown";
      const equippedMods = unit?.data?.mods || unit?.mods || unit?.equippedStatMod || [];
      if (equippedMods.length > 0) {
        characters.push({ name, modCount: equippedMods.length });
        equippedMods.forEach((mod) => {
          mods.push({ ...mod, characterName: name });
        });
      }
    });
    res.json({
      ok: true,
      playerName,
      allyCode: code,
      gp,
      guildName,
      modCount: mods.length,
      characterCount: characters.length,
      characters,
      mods,
      _raw: { unitCount: unitList.length },
    });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MODEX-7 Proxy v1.2 on port ${PORT}`));
module.exports = app;
