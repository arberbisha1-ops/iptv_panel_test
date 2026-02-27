const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER (I rregullova sipas atyre që më dhe ti)
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// Përdoruesit e tu lokalë
let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. FAQJA ADMIN (Këtu krijon userat e tu)
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px; border-bottom:1px solid #444;">ID: ${u.id} | User: <b>${u.user}</b></td>
                <td style="padding:10px; border-bottom:1px solid #444;"><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua!')">Kopjo Linkun</button></td></tr>`;
    }).join('');

    res.send(`
    <body style="background:#121212; color:white; font-family:sans-serif; padding:20px;">
        <div style="max-width:600px; margin:auto; background:#1e1e1e; padding:20px; border-radius:10px;">
            <h2 style="color:#00d1b2;">IPTV Panel - Railway Edition</h2>
            <form method="POST" action="/add-user" style="display:flex; gap:10px; margin-bottom:20px;">
                <input name="u" placeholder="User" required style="padding:8px;">
                <input name="p" placeholder="Pass" required style="padding:8px;">
                <input name="d" type="number" placeholder="Ditë" required style="width:60px; padding:8px;">
                <button type="submit" style="background:#00d1b2; border:none; padding:8px 15px; cursor:pointer;">Shto</button>
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

// 2. GJENERUESI I LISTËS (Kjo thërret serverin rus)
app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e pasaktë.");

    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        const response = await axios.get(targetUrl, {
            headers: { 'User-Agent': 'VLC/3.0.12 LibVLC/3.0.12' },
            timeout: 15000
        });
        
        // Këtu bëjmë bypass limitin e connections duke i dhënë direkt linkun e kanalit
        // rusi do shohë IP-në e klientit tënd, jo të Railway-t
        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(response.data);
    } catch (e) {
        // Nëse Railway bllokohet, përdorim planin B: Redirect direkt te rusi
        res.redirect(targetUrl);
    }
});

app.listen(PORT, '0.0.0.0', () => console.log("Serveri po punon!"));
