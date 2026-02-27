const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

// E RËNDËSISHME: Llogaria jote MASTER që do "shpërndahet"
const MASTER_DNS = "http://line.trxdnscloud.ru";
const MASTER_USER = "USERI_YT_REAL"; 
const MASTER_PASS = "PASS_YT_REAL";

// Databaza fiktive (në memorje)
let vUsers = [
    { user: "admin", pass: "admin123", expire: new Date("2030-01-01") }
];

// 1. DASHBOARD PËR TY (ADMIN)
app.get('/admin', (req, res) => {
    let rows = vUsers.map(u => `
        <tr>
            <td>${u.user}</td>
            <td>${u.pass}</td>
            <td>${u.expire.toLocaleDateString()}</td>
            <td>${u.expire > new Date() ? '✅ Aktiv' : '❌ Skaduar'}</td>
        </tr>`).join('');

    res.send(`
        <body style="font-family:sans-serif; background:#121212; color:white; padding:20px;">
            <h2>Shto Përdorues Virtualë (Pa Kredi)</h2>
            <form method="POST" action="/admin/add" style="background:#1e1e1e; padding:15px; border-radius:8px;">
                <input name="u" placeholder="User" required>
                <input name="p" placeholder="Pass" required>
                <input name="d" type="number" placeholder="Ditë" required>
                <button type="submit">Krijo User</button>
            </form>
            <table border="1" style="width:100%; margin-top:20px; border-collapse:collapse;">
                <tr><th>User</th><th>Pass</th><th>Skadimi</th><th>Statusi</th></tr>
                ${rows}
            </table>
        </body>
    `);
});

// 2. LOGJIKA E SHTIMIT TË USERAVE
app.post('/admin/add', (req, res) => {
    const { u, p, d } = req.body;
    let exp = new Date();
    exp.setDate(exp.getDate() + parseInt(d));
    vUsers.push({ user: u, pass: p, expire: exp });
    res.redirect('/admin');
});

// 3. LINKU QË DO PËRDORIN KLIENTËT
// Linku: https://projekti.railway.app/get.php?username=USER&password=PASS
app.get('/get.php', (req, res) => {
    const { username, password } = req.query;
    const found = vUsers.find(u => u.user === username && u.password === password);

    if (found && found.expire > new Date()) {
        // REDIRECT TEK BURIMI REAL
        const finalUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;
        res.redirect(finalUrl);
    } else {
        res.status(403).send("Llogaria nuk ekziston ose ka skaduar!");
    }
});

app.listen(PORT, '0.0.0.0', () => console.log(`Admin Panel në portën ${PORT}`));
