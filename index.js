const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. DASHBOARD (Shtohet kolona per Proxy)
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td>${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}')">Kopjo M3U</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;"><h2>Proxy Stream Panel</h2><form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number"><button>Shto</button></form><table>${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 2. GJENERUESI I LISTËS (Rishkruan linket e kanaleve)
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);
    if (!found || found.expire < new Date()) return res.status(403).send("Expired");

    try {
        const response = await axios.get(`${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`);
        const host = req.get('host');
        const protocol = req.protocol;

        // KJO PJESË NDRYSHON LINKET E KANALEVE:
        // Nga: http://rus.com/live/user/pass/123.ts
        // Ne: http://railway.app/proxy/test1/test1/123.ts
        let m3u = response.data.replace(
            new RegExp(`${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/(\\d+\\.ts)`, 'g'),
            `${protocol}://${host}/proxy/${username}/${password}/$1`
        );

        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(m3u);
    } catch (e) { res.redirect(`${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus`); }
});

// 3. URA E VIDEOS (PROXY STREAM)
app.get('/proxy/:u/:p/:id', async (req, res) => {
    const { u, p, id } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p);
    if (!found) return res.status(403).send();

    const streamUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${id}`;
    
    try {
        const streamResponse = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            headers: { 'User-Agent': 'VLC/3.0.12' }
        });

        res.setHeader('Content-Type', 'video/mp2t');
        streamResponse.data.pipe(res);
    } catch (e) { res.status(500).end(); }
});

app.listen(PORT, '0.0.0.0');
