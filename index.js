const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

// KJO ËSHTË ZGJIDHJA: Një proxy që ndryshon IP-në e Railway
// Mund të përdorësh një proxy falas ose API si ScraperAPI
const PROXY_URL = "https://api.webscraping.ai/html";
const PROXY_API_KEY = "d47a632b-c9e9-42bf-a553-c1e01428b780"; // Regjistrohu falas dhe merre këtu

let vUsers = [{ id: "101", user: "admin", pass: "admin123", expire: new Date("2030-01-01") }];

app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found) return res.status(403).send("Llogari e pasakte.");

    // Linku MASTER
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=ts`;

    try {
        // I kërkojmë Proxy-t të na marrë listën me një IP tjetër
        const response = await axios.get(PROXY_URL, {
            params: {
                api_key: PROXY_API_KEY,
                url: targetUrl
            }
        });

        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(response.data);

    } catch (e) {
        // Nëse edhe kjo dështon, bëjmë Redirect-in e fundit
        res.redirect(targetUrl);
    }
});

app.listen(PORT, '0.0.0.0');
