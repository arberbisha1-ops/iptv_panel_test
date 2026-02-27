app.get('/get.php', async (req, res) => {
    const { username, password, id } = req.query;
    const found = vUsers.find(u => u.user === username && u.pass === password && u.id === id);
    
    if (!found || found.expire < new Date()) return res.status(403).send("Llogari e pasakte.");

    // Shtojme formatin &output=m3u8 qe eshte me universal per aplikacionet
    const targetUrl = `${MASTER_DNS}/get.php?username=${MASTER_USER}&password=${MASTER_PASS}&type=m3u_plus&output=m3u8`;

    try {
        const response = await axios.get(targetUrl, {
            headers: { 
                // Imitojme nje Smart TV qe te mos bllokohemi
                'User-Agent': 'Mozilla/5.0 (SmartHub; SMART-TV; Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.95 Safari/537.36' 
            },
            timeout: 20000
        });
        
        res.setHeader('Content-Type', 'application/octet-stream');
        res.send(response.data);
    } catch (e) {
        // Plan B: Redirect nese dështon lidhja nga Railway
        res.redirect(targetUrl);
    }
});
