const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const REAL_IPTV_DNS = "http://line.trxdnscloud.ru";

// Faqja Kryesore (Frontend)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="sq">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IPTV Panel Pro</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #1a1a2e; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .container { background: #16213e; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); width: 350px; text-align: center; }
            h2 { color: #e94560; margin-bottom: 20px; }
            input { width: 100%; padding: 12px; margin: 10px 0; border-radius: 5px; border: none; outline: none; box-sizing: border-box; }
            button { width: 100%; padding: 12px; background-color: #e94560; border: none; color: white; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 16px; transition: 0.3s; }
            button:hover { background-color: #ff2e63; }
            #result { margin-top: 20px; padding: 15px; background: #0f3460; border-radius: 5px; display: none; word-break: break-all; font-size: 14px; text-align: left; }
            .label { font-size: 12px; color: #999; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>IPTV Generator</h2>
            <input type="text" id="user" placeholder="Username">
            <input type="text" id="pass" placeholder="Password">
            <button onclick="generate()">Gjenero Linjën</button>
            
            <div id="result">
                <div class="label">Linku M3U:</div>
                <div id="m3uLink" style="color: #4db8ff;"></div>
                <hr style="border: 0.5px solid #16213e; margin: 10px 0;">
                <div class="label">Xtream Details:</div>
                <div id="xtream" style="color: #4db8ff;"></div>
            </div>
        </div>

        <script>
            function generate() {
                const user = document.getElementById('user').value;
                const pass = document.getElementById('pass').value;
                if(!user || !pass) { alert('Plotëso fushat!'); return; }
                
                const m3u = \`${REAL_IPTV_DNS}/get.php?username=\${user}&password=\${pass}&type=m3u_plus&output=ts\`;
                
                document.getElementById('result').style.display = 'block';
                document.getElementById('m3uLink').innerText = m3u;
                document.getElementById('xtream').innerText = "Host: ${REAL_IPTV_DNS} | User: " + user + " | Pass: " + pass;
            }
        </script>
    </body>
    </html>
    `);
});

// Ruajmë gjithashtu endpoint-in /generate nëse të duhet për automatizim
app.get('/generate', (req, res) => {
    const { user, pass } = req.query;
    if (!user || !pass) return res.status(400).send("Gabim: Duhet username dhe password!");
    const m3uLink = `${REAL_IPTV_DNS}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=ts`;
    res.json({ status: "Success", m3u_url: m3uLink, xtream_details: { dns: REAL_IPTV_DNS, username: user, password: pass } });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveri po dëgjon në portën ${PORT}`);
});
