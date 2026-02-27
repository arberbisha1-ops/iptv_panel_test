const express = require('express');
const axios = require('axios');
const readline = require('readline');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// Shtojme nje ID per cdo user
let vUsers = [{ id: 1, user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        // Linku tani ka /u${u.id}/ per ta bere unik
        const userLink = `${protocol}://${host}/u${u.id}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | User: ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua linku unik!');">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;"><h2>Admin Panel (Unique Routes)</h2>
    <form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button>Shto User</button></form>
    <table border="1" style="width:100%; margin-top:20px;">${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    const newId = vUsers.length + 1;
    vUsers.push({ id: newId, user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// Ky endpoint pranon /u1/, /u2/, etj.
app.get('/u:id/get.php', async (req, res) => {
    const { username, password } = req.query;
    const { id } = req.params; // Marrim ID-ne nga URL
    
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id == id);
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e pasakte ose e skaduar");

    const host = req.get('host');
    const protocol = req.protocol;
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({ method: 'get', url: targetUrl, responseType: 'stream', timeout: 30000 });
        res.setHeader('Content-Type', 'application/mpegurl');
        
        const rl = readline.createInterface({ input: response.data, terminal: false });

        rl.on('line', (line) => {
            let trimmed = line.trim();
            if (trimmed.startsWith('http')) {
                const parts = trimmed.split('/');
                const streamId = parts[parts.length - 1];
                // Edhe proxy behet unik me /u${id}/
                res.write(`${protocol}://${host}/u${id}/proxy/${username}/${password}/${streamId}\n`);
            } else if (trimmed.length > 0) {
                res.write(trimmed + '\n');
            }
        });
        rl.on('close', () => res.end());
    } catch (e) { res.redirect(targetUrl); }
});

// Proxy unik per cdo user
app.get('/u:id/proxy/:u/:p/:sid', (req, res) => {
    const { u, p, sid, id } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p && user.id == id);
    
    if (found && found.expire > new Date()) {
        const realUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${sid}`;
        res.redirect(302, realUrl);
    } else {
        res.status(403).end();
    }
});

app.listen(PORT, '0.0.0.0');
