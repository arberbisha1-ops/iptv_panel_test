const express = require('express');
const axios = require('axios');
const readline = require('readline');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// ADMIN DASHBOARD
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | User: ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('Linku u kopjua!');">Kopjo M3U</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;">
    <h2>IPTV Manager</h2>
    <form method="POST" action="/admin/add" style="background:#222;padding:15px;border-radius:8px;">
        <input name="u" placeholder="User" required>
        <input name="p" placeholder="Pass" required>
        <input name="d" type="number" placeholder="Dite" required>
        <button type="submit">Krijo User të Ri</button>
    </form>
    <table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">
        <tr style="background:#333;"><th>Përdoruesi</th><th>Veprimi</th></tr>
        ${rows}
    </table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    const newId = Math.floor(100 + Math.random() * 900); // Gjeneron ID unike 3 shifrore
    vUsers.push({ id: newId.toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// GET.PHP - E OPTIMIZUAR DHE UNIK
app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    
    // Verifikojmë user, pass DHE id
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    if (!found || found.expire < new Date()) return res.status(403).send("Error: Llogari e pasakte ose e skaduar.");

    const host = req.get('host');
    const protocol = req.protocol;
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 45000, // I japim kohe llogarive te medha
            headers: { 'User-Agent': 'VLC/3.0.12' }
        });

        res.setHeader('Content-Type', 'application/mpegurl');
        res.setHeader('Content-Disposition', `attachment; filename=playlist_${id}.m3u`);

        const rl = readline.createInterface({ input: response.data, terminal: false });

        rl.on('line', (line) => {
            let trimmed = line.trim();
            if (trimmed.startsWith('http')) {
                const parts = trimmed.split('/');
                const streamId = parts[parts.length - 1];
                // Linku i proxy tani mban edhe ID-ne unike
                res.write(`${protocol}://${host}/proxy/${id}/${username}/${password}/${streamId}\n`);
            } else if (trimmed.length > 0) {
                res.write(trimmed + '\n');
            }
        });

        rl.on('close', () => res.end());

        response.data.on('error', () => res.end());

    } catch (e) {
        console.error("Axios Error:", e.message);
        res.status(500).send("Serveri Master nuk po pergjigjet. Provo pas pak.");
    }
});

// PROXY ME REDIRECT UNIK
app.get('/proxy/:id/:u/:p/:sid', (req, res) => {
    const { id, u, p, sid } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p && user.id === id);
    
    if (found && found.expire > new Date()) {
        const realUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${sid}`;
        res.redirect(302, realUrl);
    } else {
        res.status(403).end();
    }
});

app.listen(PORT, '0.0.0.0');
