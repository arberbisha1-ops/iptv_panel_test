const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// BURIMI KRYESOR (Aty ku merret sinjali)
const MASTER_DNS = "http://jkekjdiu.mossaptv.com";
const MASTER_USER = "ULFX541A";
const MASTER_PASS = "Q51P2XBU";

// DATABASE E THJESHTË (Në një projekt real përdoret MongoDB ose MySQL)
let clients = [
    { username: "klienti1", password: "p1", expire: "2026-12-31", status: "Active" }
];

// 1. DASHBOARD PËR TË KRIJUAR USERA TË RINJ
app.get('/admin', (req, res) => {
    let rows = clients.map(c => `
        <tr>
            <td>${c.username}</td>
            <td>${c.status}</td>
            <td><code>${req.protocol}://${req.get('host')}/get.php?u=${c.username}&p=${c.password}</code></td>
        </tr>`).join('');

    res.send(`
        <body style="font-family:sans-serif; background:#1a1a1a; color:white; padding:20px;">
            <h2>Personal IPTV Panel</h2>
            <form action="/create" method="POST" style="background:#333; padding:15px; border-radius:8px;">
                <input name="u" placeholder="User i ri" required>
                <input name="p" placeholder="Pass i ri" required>
                <button type="submit">Gjenero User</button>
            </form>
            <table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">
                <tr><th>User</th><th>Status</th><th>M3U Link</th></tr>
                ${rows}
            </table>
        </body>`);
});

app.post('/create', (req, res) => {
    clients.push({ username: req.body.u, password: req.body.p, expire: "2026-12-31", status: "Active" });
    res.redirect('/admin');
});

// 2. LOGJIKA E "KLONIMIT" TË SINJALIT (Get.php)
app.get('/get.php', async (req, res) => {
    const { u, p } = req.query;
    const user = clients.find(c => c.username === u && c.password === p);

    if (!user) return res.status(403).send("Llogari e panjohur");

    try {
        // I marrim listen MegaOTT-s duke u hequr sikur jemi ne
        const masterUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=mpegts`;
        const response = await axios.get(masterUrl);
        
        // Ndryshojmë linjat që të kalojnë nga serveri ynë
        let playlist = response.data;
        const myHost = `${req.protocol}://${req.get('host')}`;
        
        // Zëvendësojmë DNS e MegaOTT me DNS tonë
        let modified = playlist.split(`${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/`).join(`${myHost}/stream/`);
        
        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(modified);
    } catch (e) {
        res.status(500).send("Burimi Master nuk po përgjigjet.");
    }
});

// 3. STREAM RELAY (Këtu bëhet transmetimi)
app.get('/stream/:id', async (req, res) => {
    const streamUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${req.params.id}`;
    try {
        const stream = await axios({ method: 'get', url: streamUrl, responseType: 'stream' });
        res.setHeader('Content-Type', 'video/mp2t');
        stream.data.pipe(res);
    } catch (e) { res.status(404).end(); }
});

app.listen(PORT);
