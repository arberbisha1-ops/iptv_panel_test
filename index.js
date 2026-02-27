const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// E DHËNAT MASTER (MegaOTT)
const MASTER_URL = "http://jkekjdiu.mossaptv.com/get.php?username=ULFX541A&password=Q51P2XBU&type=m3u_plus&output=mpegts";

// Lista e përdoruesve që krijon ti (Ruhen në RAM)
let vUsers = [
    { user: "klienti1", pass: "pass123", expire: "2026-12-31" },
    { user: "klienti2", pass: "pass456", expire: "2026-12-31" }
];

// 1. DASHBOARD ADMIN (Për të parë dhe shtuar userat)
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/playlist.m3u?u=${u.user}&p=${u.pass}`;
        return `
        <tr style="border-bottom:1px solid #444;">
            <td style="padding:10px;">User: <b>${u.user}</b></td>
            <td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua!')">Kopjo Linkun e Klonuar</button></td>
        </tr>`;
    }).join('');

    res.send(`
    <body style="background:#121212; color:white; font-family:sans-serif; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#1e1e1e; padding:20px; border-radius:10px;">
            <h2 style="color:#00d1b2;">MegaOTT Cloner Panel</h2>
            <form method="POST" action="/add-user" style="margin-bottom:20px; display:flex; gap:10px;">
                <input name="u" placeholder="User i ri" required>
                <input name="p" placeholder="Pass i ri" required>
                <button type="submit" style="background:#00d1b2; border:none; padding:5px 15px; cursor:pointer;">Krijo Klon</button>
            </form>
            <table style="width:100%; text-align:left;">${rows}</table>
        </div>
    </body>`);
});

app.post('/add-user', (req, res) => {
    const { u, p } = req.body;
    vUsers.push({ user: u, pass: p, expire: "2026-12-31" });
    res.redirect('/admin');
});

// 2. GJENERUESI I PLAYLIST-ËS (Klonimi Real)
app.get('/playlist.m3u', async (req, res) => {
    const { u, p } = req.query;
    
    // Verifikojmë nëse përdoruesi i klonuar është i saktë
    const found = vUsers.find(user => user.user === u && user.pass === p);
    
    if (!found) {
        return res.status(403).send("Gabim: Ky përdorues i klonuar nuk ekziston.");
    }

    try {
        // Marrim listën nga serveri origjinal MegaOTT
        const response = await axios({
            method: 'get',
            url: MASTER_URL,
            responseType: 'stream', // Streaming për të mos bllokuar RAM-in
            headers: {
                'User-Agent': 'VLC/3.0.12 LibVLC/3.0.12'
            },
            timeout: 30000
        });

        // I përcjellim të dhënat te klienti sikur vijnë nga Railway
        res.setHeader('Content-Type', 'application/mpegurl');
        res.setHeader('Content-Disposition', 'attachment; filename=megaott_clone.m3u');
        
        response.data.pipe(res);

    } catch (e) {
        console.error("Gabim gjatë klonimit:", e.message);
        res.status(500).send("Serveri MegaOTT nuk po përgjigjet.");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log("Cloner is running!"));
