const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// Lista e përdoruesve (Ruhet në memorje derisa serveri të bëjë restart)
let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | User: ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('Linku u kopjua!');">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;">
        <h2>IPTV Safe Panel (No-Proxy Mode)</h2>
        <form method="POST" action="/admin/add" style="background:#222;padding:15px;border-radius:8px;">
            <input name="u" placeholder="User" required> <input name="p" placeholder="Pass" required> <input name="d" type="number" placeholder="Dite" required>
            <button type="submit">Shto User</button>
        </form>
        <table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">${rows}</table>
    </body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    const newId = Math.floor(1000 + Math.random() * 9000);
    vUsers.push({ id: newId.toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// METODA E RE: REDIRECT I DREJTPËRDREJTË
app.get('/get.php', (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (found && found.expire > new Date()) {
        // Në vend që ta shkarkojmë listën, e dërgojmë lojtarin direkt te burimi
        // Kjo bën që lista të hapet 100% sepse lojtari ka IP-në e tij (jo të Railway)
        const directUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;
        res.redirect(302, directUrl);
    } else {
        res.status(403).send("Llogaria nuk është aktive.");
    }
});

// Ky endpoint nuk do të përdoret më por po e lëmë për siguri
app.get('/proxy/:id/:u/:p/:sid', (req, res) => {
    res.status(404).send("Përdorni linkun e ri të gjeneruar.");
});

app.listen(PORT, '0.0.0.0', () => console.log("Serveri është gati!"));
