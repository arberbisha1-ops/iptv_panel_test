const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// Përdoruesit lokalë (Shtohen te /admin)
let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. DASHBOARD ADMIN
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr style="border-bottom:1px solid #444;">
                    <td style="padding:10px;">ID: ${u.id} | User: <b>${u.user}</b></td>
                    <td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua!')">Kopjo Linkun</button></td>
                </tr>`;
    }).join('');

    res.send(`
    <body style="background:#121212; color:white; font-family:sans-serif; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#1e1e1e; padding:20px; border-radius:10px;">
            <h2 style="color:#00d1b2;">IPTV Multi-User Manager</h2>
            <form method="POST" action="/add-user" style="display:flex; gap:10px; margin-bottom:20px;">
                <input name="u" placeholder="User" required style="padding:8px;">
                <input name="p" placeholder="Pass" required style="padding:8px;">
                <input name="d" type="number" placeholder="Ditë" required style="width:60px; padding:8px;">
                <button type="submit" style="background:#00d1b2; color:white; border:none; padding:8px 15px; cursor:pointer;">Shto User</button>
            </form>
            <table style="width:100%; border-collapse:collapse;">${rows}</table>
        </div>
    </body>`);
});

app.post('/add-user', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ id: Math.floor(1000+Math.random()*9000).toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 2. GJENERUESI I LISTËS (STREAM PROXY)
app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    
    // Verifikimi i përdoruesit
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    if (!found || found.expire < new Date()) {
        return res.status(403).send("Llogari e pasakte ose e skaduar.");
    }

    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream', // Mbron RAM-in nga Out of Memory
            headers: { 
                'User-Agent': 'VLC/3.0.12 LibVLC/3.0.12',
                'Accept': '*/*'
            },
            timeout: 30000
        });

        // Konfigurimi i Header-ave që të njihet si playlist nga çdo App
        res.setHeader('Content-Type', 'application/mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');

        // Kalon të dhënat direkt te klienti (browser ose app)
        response.data.pipe(res);

    } catch (e) {
        console.error("Gabim në lidhje:", e.message);
        // Fallback: Nëse dështon stream-i, provo redirect-in e fundit
        res.redirect(302, targetUrl);
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Serveri eshte online ne porten ${PORT}`));
