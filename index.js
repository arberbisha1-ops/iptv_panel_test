const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// E dhëna e vetme që harxhohet: Llogaria jote Master
const SOURCE_DNS = "http://line.trxdnscloud.ru";
const MASTER_USER = "USERI_YT_REAL"; 
const MASTER_PASS = "PASS_YT_REAL";

// Databaza Lokale (Këtu mund të shtosh pa limit)
let localUsers = [
    { user: "klienti1", pass: "pass1", expires: "2026-12-31" },
    { user: "test1", pass: "test1", expires: "2026-02-28" }
];

app.get('/get.php', (req, res) => {
    const { username, password } = req.query;

    // Kontrollojmë nëse përdoruesi ekziston në databazën tonë lokale
    const userFound = localUsers.find(u => u.user === username && u.pass === password);

    if (userFound) {
        // Nëse përdoruesi është OK, e dërgojmë te serveri real me llogarinë tonë Master
        // Serveri real sheh vetëm Master llogarinë, jo klientin
        const realUrl = `${SOURCE_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;
        res.redirect(realUrl);
    } else {
        res.status(403).send("Gabim: Llogaria nuk ekziston ose ka skaduar!");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Paneli Virtual po punon në portën ${PORT}`);
});
