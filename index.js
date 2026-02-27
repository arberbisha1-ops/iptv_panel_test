const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// SHËNIM: Vendos të dhënat e tua MASTER këtu
const MASTER_DNS = "http://line.trxdnscloud.ru";
const MASTER_USER = "USERI_YT_REAL"; 
const MASTER_PASS = "PASS_YT_REAL";

let vUsers = [
    { user: "admin", pass: "admin123", expire: new Date("2030-01-01") }
];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:8px;">${u.user}</td><td>${u.pass}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('Linku u kopjua!');">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212; color:white; font-family:sans-serif;"><h2>Admin Panel</h2><form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button type="submit">Shto User</button></form><br><table border="1" style="width:100%; border-collapse:collapse;"><tr><th>User</th><th>Pass</th><th>Veprim</th></tr>${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date();
    exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// GET.PHP - VERSIONI QË "MASHTRON" APLIKACIONET
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);

    if (found && found.expire > new Date()) {
        try {
            // Marrim listën nga serveri rus
            const response = await axios.get(`${MASTER_DNS}/get.php`, {
                params: {
                    username: MASTER_USER,
                    password: MASTER_PASS,
                    type: 'm3u_plus',
                    output: 'ts'
                },
                timeout: 10000 // Presim deri ne 10 sekonda
            });

            // KJO ËSHTË PJESA KRITIKE:
            // I themi aplikacionit që kjo është listë IPTV
            res.setHeader('Content-Type', 'application/mpegurl');
            res.setHeader('Content-Disposition', 'attachment; filename=playlist.m3u');
            
            // Dërgojmë të dhënat
            res.send(response.data);

        } catch (error) {
            console.error("Gabim gjatë marrjes së të dhënave:", error.message);
            res.status(500).send("Gabim: Serveri burim nuk po përgjigjet.");
        }
    } else {
        res.status(403).send("Llogaria nuk ekziston ose ka skaduar.");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Serveri eshte gati ne porten ${PORT}`));
