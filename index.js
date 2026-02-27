const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER (Sigurohu që janë 100% saktë)
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. DASHBOARD ADMIN (Aksesimi: /admin)
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}')">Kopjo M3U</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;">
        <h2>IPTV Final Control</h2>
        <form method="POST" action="/add"><input name="u" placeholder="User" required><input name="p" placeholder="Pass" required><input name="d" type="number" placeholder="Dite" required><button>Shto</button></form>
        <table border="1" style="width:100%; margin-top:20px;">${rows}</table>
    </body>`);
});

app.post('/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ id: Math.floor(1000+Math.random()*9000).toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 2. GET.PHP (Redirect 302)
app.get('/get.php', (req, res) => {
    const { username, password, id } = req.query;
    
    // Kontrollojmë nëse përdoruesi ekziston në Railway tonë
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (found && found.expire > new Date()) {
        // Krijojmë linkun MASTER
        const finalUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;
        
        // I themi aplikacionit: "Mos e kërko te unë, shko merre direkt te rusi"
        // Kjo anashkalon totalisht bllokimin e IP-së së Railway
        res.setHeader('Location', finalUrl);
        res.status(302).end();
    } else {
        res.status(403).send("Llogari e pasakte ose e skaduar.");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log("Serveri po punon!"));
