const express = require('express');
const axios = require('axios'); // Duhet te shtohet kjo per te marre te dhenat
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "USERI_YT_REAL"; 
const MASTER_PASS = "PASS_YT_REAL";

let vUsers = [
    { user: "admin", pass: "admin123", expire: new Date("2030-01-01") }
];

// DASHBOARD (E njejta si me pare)
app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td>${u.user}</td><td>${u.pass}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua');">Kopjo</button></td></tr>`;
    }).join('');
    res.send(`<h2>Admin Panel</h2><form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button>Shto</button></form><table border="1">${rows}</table>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date();
    exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// GET.PHP E RE - TANI MERR TE DHENAT REALISHT
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);

    if (found && found.expire > new Date()) {
        try {
            // Serveri yt shkon te serveri rus dhe merr listen e kanaleve
            const response = await axios.get(`${MASTER_DNS}/get.php`, {
                params: {
                    username: MASTER_USER,
                    password: MASTER_PASS,
                    type: 'm3u_plus',
                    output: 'ts'
                }
            });
            
            // Ja dergon listen klientit tend direkt
            res.setHeader('Content-Type', 'text/plain');
            res.send(response.data);
        } catch (error) {
            res.status(500).send("Gabim: Serveri burim nuk po pergjigjet.");
        }
    } else {
        res.status(403).send("Llogari e pasakte ose e skaduar.");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Serveri Online`));
