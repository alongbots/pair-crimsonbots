const express = require("express");
const fs = require("fs");
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  Browsers,
} = require("baileys");

const app = express();
const PORT = 3000;

app.get("/pair", async (req, res) => {
  try {
    let num = req.query.code;
    if (!num) return res.status(400).json({ error: "Phone required" });

    num = num.replace(/[^0-9]/g, "");

    if (!fs.existsSync("./session")) fs.mkdirSync("./session");

    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      browser: Browsers.ubuntu("Chrome"),
    });

    sock.ev.on("creds.update", saveCreds);

    await delay(1500);

    const code = await sock.requestPairingCode(num);

    res.json({
      code: code.match(/.{1,4}/g).join("-"),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Pairing failed" });
  }
});

app.listen(PORT, () => {
  console.log("Running on port", PORT);
});
