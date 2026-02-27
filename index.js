const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// SHËNIM: Vendos këtu të dhënat e tua reale Master
const MASTER_DNS = "http://line.trxdnscloud.ru";
const MASTER_USER = "USERI_YT_REAL"; 
const MASTER_PASS = "PASS_YT_REAL";

// Databaza në memorje
let vUsers = [
    { user: "admin", pass: "admin123", expire: new Date("2030-01-01") }
];

app.get('/admin', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;

    let rows = vUsers.map(u => {
        const userLink = `${protocol}://${host}/get.php?username=${u.user}&password=${u.pass}`;
        return `
        <tr>
            <td style="padding:10px; border:1px solid #444;">${u.user}</td>
            <td style="padding:10px; border:1px solid #444;">${u.pass}</td>
            <td style="padding:10px; border:1px solid #444;">${u.expire.toLocaleDateString()}</td>
            <td style="padding:10px; border:1px solid #444;">${u.expire > new Date() ? '✅ Aktiv' : '❌ Skaduar'}</td>
            <td style="padding:10px; border:1px solid #444;">
                <input type="text" value="${userLink}" id="input-${u.user}" style="position:absolute; left:-9999px;">
                <button onclick="copyToClipboard('input-${u.user}')" style="cursor:pointer; background:#4db8ff; border:none; border-radius:3px; padding:5px 10px; color:black; font-weight:bold;">Kopjo Linkun</button>
            </td>
        </tr>`;
    }).join('');

    res.send(`
        <!DOCTYPE html>
        <html>
        <body style="font-family:sans-serif; background:#121212; color:white; padding:20px;">
            <h2>Menaxhimi i Përdoruesve Virtualë</h2>
            <form method="POST" action="/admin/add" style="background:#1e1e1e; padding:15px; border-radius:8px; margin-bottom:20px;">
                <input name="u" placeholder="User" required style="padding:8px; margin-right:5px;">
                <input name="p" placeholder="Pass" required style="padding:8px; margin-right:5px;">
                <input name="d" type="number" placeholder="Ditë" required style="padding:8px; margin-right:5px; width:60px;">
                <button type="submit" style="background:#e94560; color:white; border:none; padding:8px 15px; cursor:pointer; border-radius:4px;">+ Shto User</button>
            </form>
            
            <table style="width:100%; border-collapse:collapse; text-align:left; background:#1e1e1e;">
                <tr style="background:#333;">
                    <th style="padding:10px; border:1px solid #444;">User</th>
                    <th style="padding:10px; border:1px solid #444;">Pass</th>
                    <th style="padding:10px; border:1px solid #444;">Skadimi</th>
                    <th style="padding:10px; border:1px solid #444;">Statusi</th>
                    <th style="padding:10px; border:1px solid #444;">Veprimi</th>
                </tr>
                ${rows}
            </table>

            <script>
                function copyToClipboard(id) {
                    var copyText = document.getElementById(id);
                    copyText.select();
                    navigator.clipboard.writeText(copyText.value);
                    alert("Linku u kopjua!");
                }
            </script>
        </body>
        </html>
    `);
});

app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date();
    exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

app.get('/get.php', (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password);

    if (found && found.expire > new Date()) {
        const finalUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;
        res.redirect(finalUrl);
    } else {
        res.status(403).send("Llogaria nuk ekziston ose ka skaduar!");
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveri eshte online ne porten ${PORT}`);
});
