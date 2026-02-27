const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const MASTER_DNS = "http://hkywyphf.mossaptv.com";
const MASTER_USER = "LMHBTM9T"; 
const MASTER_PASS = "ZNDWAKAP";

app.get('/get.php', async (req, res) => {
    try {
        const response = await axios.get(`${MASTER_DNS}/get.php`, {
            params: {
                username: MASTER_USER,
                password: MASTER_PASS,
                type: 'm3u_plus',
                output: 'ts'
            },
            headers: {
                // Kjo e ben Railwayn te duket si aplikacion IPTV
                'User-Agent': 'IPTVSmartersPlayer',
                'Accept': '*/*'
            },
            timeout: 10000
        });
        res.setHeader('Content-Type', 'application/mpegurl');
        res.send(response.data);
    } catch (e) {
        res.status(500).send("Serveri Master nuk pergjigjet. Llogaria mund te jete bllokuar.");
    }
});

app.listen(PORT, '0.0.0.0');
