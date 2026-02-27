const express = require('express');
const axios = require('axios');
const readline = require('readline');
const { Readable } = require('stream');

const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// ADMIN PANEL
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua');">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;"><h2>Admin Panel (Memory Optimized)</h2>
    <form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button>Shto</button></form>
    <table border="1" style="width:100%; margin-top:20px;">${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// GET.PHP - E OPTIMIZUAR PËR TË MOS MBUSHUR RAM-IN
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e skaduar");

    const host = req.get('host');
    const protocol = req.protocol;
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream', // E marrim si stream, jo si tekst te plote
            timeout: 30000
        });

        res.setHeader('Content-Type', 'application/mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');

        const rl = readline.createInterface({
            input: response.data,
            terminal: false
        });

        // Lexojme rresht per rresht dhe i dergojme klientit
        rl.on('line', (line) => {
            if (line.startsWith('http')) {
                // Gjejme ID-ne e stream-it ne fund te linkut (psh: 12345.ts)
                const parts = line.split('/');
                const streamId = parts[parts.length - 1];
                res.write(`${protocol}://${host}/proxy/${username}/${password}/${streamId}\n`);
            } else {
                res.write(line + '\n');
            }
        });

        rl.on('close', () => {
            res.end();
        });

    } catch (e) {
        console.error("Error fetching M3U stream");
        res.redirect(targetUrl); // Fallback nese deshton
    }
});

// PROXY REDIRECT (302)
app.get('/proxy/:u/:p/:id', (req, res) => {
    const { u, p, id } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p);
    
    if (found && found.expire > new Date()) {
        const realUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${id}`;
        res.redirect(302, realUrl);
    } else {
        res.status(403).end();
    }
});

app.listen(PORT, '0.0.0.0', () => console.log("Serveri eshte online - RAM usage: LOW"));
