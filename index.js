const express = require('express');
const axios = require('axios');
const readline = require('readline');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | User: ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('Linku u kopjua!');">Kopjo M3U</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;"><h2>IPTV Manager v3</h2><form method="POST" action="/admin/add"><input name="u" placeholder="User" required><input name="p" placeholder="Pass" required><input name="d" type="number" placeholder="Dite" required><button type="submit">Shto User</button></form><table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    const newId = Math.floor(1000 + Math.random() * 9000);
    vUsers.push({ id: newId.toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e pasakte.");

    const host = req.get('host');
    const protocol = req.protocol;
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 15000,
            headers: { 'User-Agent': 'VLC/3.0.12' }
        });

        res.setHeader('Content-Type', 'application/mpegurl');
        const rl = readline.createInterface({ input: response.data, terminal: false });

        rl.on('line', (line) => {
            let trimmed = line.trim();
            if (trimmed.startsWith('http')) {
                const streamId = trimmed.split('/').pop();
                res.write(`${protocol}://${host}/proxy/${id}/${username}/${password}/${streamId}\n`);
            } else {
                res.write(trimmed + '\n');
            }
        });
        rl.on('close', () => res.end());

    } catch (e) {
        // NESE RAILWAY ESHTE I BLLOKUAR, DËRGOJE DIREKT TE BURIMI
        console.log("Bllokim nga burimi, duke bere redirect direkt...");
        res.redirect(targetUrl);
    }
});

app.get('/proxy/:id/:u/:p/:sid', (req, res) => {
    const { id, u, p, sid } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p && user.id === id);
    if (found && found.expire > new Date()) {
        res.redirect(302, `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${sid}`);
    } else {
        res.status(403).end();
    }
});

app.listen(PORT, '0.0.0.0');
