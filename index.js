const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// TË DHËNAT TUAJA
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. DASHBOARD
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr style="border-bottom:1px solid #444;"><td style="padding:10px;">User: <b>${u.user}</b></td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua!')">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;"><div style="max-width:500px;margin:auto;background:#222;padding:20px;border-radius:10px;"><h2>IPTV Manager</h2><form method="POST" action="/add"><input name="u" placeholder="User" required><input name="p" placeholder="Pass" required><input name="d" type="number" placeholder="Dite" required><button type="submit">Shto</button></form><table style="width:100%;margin-top:20px;">${rows}</table></div></body>`);
});

app.post('/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ id: Math.floor(1000+Math.random()*9000).toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 2. GET.PHP - VERSIONI QË NUK BLLOKOHET
app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e pasakte.");

    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: { 
                // Maskim i plote si aplikacion Android IPTV
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            timeout: 45000 // I japim kohe llogarive te ngarkuara
        });

        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');

        // Shmang "Out of Memory" duke e dërguar direkt te klienti
        response.data.pipe(res);

    } catch (e) {
        console.error("Gabim:", e.message);
        // Nese dështon lidhja, provojmë redirect-in si mbrojtje te fundit
        res.redirect(302, targetUrl);
    }
});

app.listen(PORT, '0.0.0.0');
