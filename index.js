const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

let vUsers = [{ user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `<tr><td style="padding:10px;">${u.user}</td><td><button onclick="navigator.clipboard.writeText('${userLink}'); alert('U kopjua');">Kopjo Linkun</button></td></tr>`;
    }).join('');
    res.send(`<body style="background:#121212;color:white;font-family:sans-serif;"><h2>Proxy Admin</h2><form method="POST" action="/admin/add"><input name="u" placeholder="User"><input name="p" placeholder="Pass"><input name="d" type="number" placeholder="Dite"><button>Shto</button></form><table border="1" style="width:100%; mt:20px;">${rows}</table></body>`);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date(); exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// GJENERUESI DINAMIK I M3U
app.get('/get.php', async (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e skaduar");

    try {
        const response = await axios.get(`${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`);
        const host = req.get('host');
        const protocol = req.protocol;

        // KJO ESHTE E RENDESISHME: Ndryshon linket ne baze te userit qe po e kerkon
        let m3u = response.data.replace(
            new RegExp(`http.*/live/${MASTER_USER}/${MASTER_PASS}/(\\d+\\.ts)`, 'g'),
            `${protocol}://${host}/proxy/${username}/${password}/$1`
        );

        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(m3u);
    } catch (e) {
        res.status(500).send("Gabim ne marrjen e listes");
    }
});

// PROXY STREAM ME MBYLLJE TE DETYRUAR
app.get('/proxy/:u/:p/:id', async (req, res) => {
    const { u, p, id } = req.params;
    const found = vUsers.find(user => user.user === u && user.pass === p);
    if (!found) return res.status(403).end();

    const streamUrl = `${MASTER_DNS}/live/${MASTER_USER}/${MASTER_PASS}/${id}`;
    
    // Krijohet nje abort controller per te mbyllur lidhjen me rusin nese klienti iken
    const controller = new AbortController();

    try {
        const streamResponse = await axios({
            method: 'get',
            url: streamUrl,
            responseType: 'stream',
            signal: controller.signal,
            headers: { 
                'User-Agent': `VLC-Proxy-${u}`,
                'Connection': 'keep-alive'
            }
        });

        res.setHeader('Content-Type', 'video/mp2t');
        streamResponse.data.pipe(res);

        // Nese klienti ndalon videon, ndalojme menjehere shkarkimin nga serveri rus
        req.on('close', () => {
            console.log(`Mbyllur lidhja per: ${u}`);
            controller.abort();
            streamResponse.data.destroy();
        });

    } catch (e) {
        res.status(500).end();
    }
});

app.listen(PORT, '0.0.0.0', () => console.log("Online"));
