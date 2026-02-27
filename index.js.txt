const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// NDRYSHO KËTË: Vendos DNS-në e serverit tënd real IPTV
const REAL_IPTV_DNS = "http://line.trxdnscloud.ru";

app.get('/', (req, res) => {
    res.send("Serveri i Panelit IPTV është Online!");
});

// Linku do të jetë: domain.com/generate?user=emri&pass=mbiemri
app.get('/generate', (req, res) => {
    const { user, pass } = req.query;

    if (!user || !pass) {
        return res.status(400).send("Gabim: Duhet username dhe password!");
    }

    // Krijojmë formatin m3u bazuar në serverin burim
    const m3uLink = `${REAL_IPTV_DNS}/get.php?username=${user}&password=${pass}&type=m3u_plus&output=ts`;
    
    // Krijojmë formatin Xtream Codes (për aplikacione si Smarters)
    const response = {
        status: "Success",
        m3u_url: m3uLink,
        xtream_details: {
            dns: REAL_IPTV_DNS,
            username: user,
            password: pass
        }
    };

    res.json(response);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveri po dëgjon në portën ${PORT}`);

});
