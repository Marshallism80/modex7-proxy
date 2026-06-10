const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "MODEX-7 Proxy online" });
});

app.get("/api/mods/:allyCode", async (req, res) => {
  const code = String(req.params.allyCode).replace(/[-\s]/g, "");
  if (!code || code.length < 9) return res.status(400).json({ error: "Invalid ally code." });
  try {
    const response = await fetch(
      `https://swgoh.gg/api/player/${code}/?include=units`,
      { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } }
    );
    if (!response.ok) return res.status(404).json({ error: `Player not found. Code: ${code}` });
    const data = await response.json();

    const mods = [];
    const units = data.units || data.rosterUnit || [];
    units.forEach(unit => {
      const name = unit.data?.name || unit.name || unit.definitionId || "Unknown";
      const equipped = unit.data?.mods || unit.equippedStatMod || unit.mods || [];
      equipped.forEach(mod => mods.push({ ...mod, characterName: name }));
    });

    res.json({
      playerName: data.data?.name || data.name || "Unknown",
      allyCode: code,
      gp: data.data?.galactic_power || data.galactic_power || 0,
      guildName: data.data?.guild_name || data.guild_name || null,
      modCount: mods.length,
      mods,
    });
  } catch (err) {
    res.status(500).json({ error: "Fetch failed.", detail: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`MODEX-7 Proxy on port ${PORT}`));
module.exports = app;
