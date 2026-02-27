const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// TË DHËNAT MASTER
const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// VENDO API KEY-N TËND KËTU (Merre falas te ScraperAPI)
const SCRAPER_API_KEY = "VENDOSE_API_KEY_KETU"; 

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

// 1. DASHBOARD ADMIN
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?id=${u.id}&username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">ID: ${u.id} | ${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}')">Kopjo</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;padding:20px;"><h2>Admin Panel + Proxy API</h2><form method="POST" action="/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button>Shto</button></form><table border="1" style="width:100%; margin-top:20px;">${rows}</table></body>`);
});

app.post('/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ id: Math.floor(1000+Math.random()*9000).toString(), user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 2. GET.PHP ME API PROXY (PËR TË ANALSHKALUAR BLLOKIMIN E IP)
app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found || found.expire < new Date()) return res.status(403).send("Jo aktiv.");

    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        // Përdorim ScraperAPI për të marrë listën me një IP tjetër
        const response = await axios.get('http://api.scraperapi.com', {
            params: {
                api_key: SCRAPER_API_KEY,
                url: targetUrl
            },
            timeout: 60000 // Listat IPTV janë të mëdha, duhet kohë
        });

        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(response.data);

    } catch (e) {
        console.log("Proxy API deshtoi, duke perdorur Redirect...");
        res.redirect(targetUrl);
    }
});

app.listen(PORT, '0.0.0.0');
