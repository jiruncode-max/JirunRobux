// api/user.js — Jalur Server Vercel Pribadi (Server Vercel -> Roblox Resmi, 100% Bebas Blokir CORS)
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const q = req.query || {};
    const UA = { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    };

    try {
        // ===== 1) CEK USERNAME PERSIS: /api/user?username=nama =====
        if (q.username) {
            const clean = q.username.trim().replace(/^@+/, '');
            let user = null;

            // Jalur 1: POST resmi v1/usernames/users
            try {
                const r = await fetch('https://users.roblox.com/v1/usernames/users', {
                    method: 'POST',
                    headers: Object.assign({ 'Content-Type': 'application/json' }, UA),
                    body: JSON.stringify({ usernames: [clean], excludeBannedUsers: false })
                });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.data && data.data.length > 0) {
                        const u = data.data[0];
                        user = { id: u.id, name: u.name, displayName: u.displayName || u.name };
                    }
                }
            } catch(e) {}

            // Jalur 2: Search jika POST tidak menemukan
            if (!user) {
                try {
                    const r = await fetch('https://users.roblox.com/v1/users/search?keyword=' + encodeURIComponent(clean) + '&limit=5', { headers: UA });
                    if (r.ok) {
                        const data = await r.json();
                        if (data && data.data && data.data.length > 0) {
                            const exact = data.data.find(u => u.name.toLowerCase() === clean.toLowerCase()) || data.data[0];
                            user = { id: exact.id, name: exact.name, displayName: exact.displayName || exact.name };
                        }
                    }
                } catch(e) {}
            }

            return res.status(200).json({ ok: true, found: !!user, user });
        }

        // ===== 2) SEARCH LIST: /api/user?search=kata =====
        if (q.search) {
            const kw = encodeURIComponent(q.search.trim().replace(/^@+/, ''));
            try {
                const r = await fetch('https://users.roblox.com/v1/users/search?keyword=' + kw + '&limit=10', { headers: UA });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.data) {
                        return res.status(200).json({
                            ok: true,
                            results: data.data.map(u => ({ id: u.id, name: u.name, displayName: u.displayName || u.name }))
                        });
                    }
                }
            } catch(e) {}
            return res.status(200).json({ ok: true, results: [] });
        }

        // ===== 3) CARI BY ID: /api/user?id=123 =====
        if (q.id) {
            try {
                const r = await fetch('https://users.roblox.com/v1/users/' + q.id, { headers: UA });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.id && data.name) {
                        return res.status(200).json({
                            ok: true, found: true,
                            user: { id: data.id, name: data.name, displayName: data.displayName || data.name }
                        });
                    }
                }
            } catch(e) {}
            return res.status(200).json({ ok: true, found: false, user: null });
        }

        // ===== 4) FOTO KEPALA (HEADSHOT): /api/user?avatar=1,2,3 =====
        if (q.avatar) {
            const ids = String(q.avatar).split(',').filter(Boolean);
            const images = {};
            try {
                const r = await fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + ids.join(',') + '&size=150x150&format=Png&isCircular=true', { headers: UA });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.data) {
                        data.data.forEach(d => { if (d.state === 'Completed') images[d.targetId] = d.imageUrl; });
                    }
                }
            } catch(e) {}
            return res.status(200).json({ ok: true, images });
        }

        // ===== 5) RENDER 3D BADAN LENGKAP: /api/user?body=123 =====
        if (q.body) {
            try {
                const r = await fetch('https://thumbnails.roblox.com/v1/users/avatar?userIds=' + q.body + '&size=420x420&format=Png&isCircular=false', { headers: UA });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.data && data.data[0] && data.data[0].imageUrl) {
                        return res.status(200).json({ ok: true, imageUrl: data.data[0].imageUrl });
                    }
                }
            } catch(e) {}
            return res.status(200).json({ ok: false, imageUrl: null });
        }

        // ===== 6) STATISTIK TEMAN & PENGIKUT: /api/user?stats=123 =====
        if (q.stats) {
            const id = q.stats;
            const stats = { friends: '-', followers: '-', following: '-' };
            try {
                const [f, fol, fing] = await Promise.all([
                    fetch('https://friends.roblox.com/v1/users/' + id + '/friends/count', { headers: UA }).then(r => r.json()).catch(() => null),
                    fetch('https://friends.roblox.com/v1/users/' + id + '/followers/count', { headers: UA }).then(r => r.json()).catch(() => null),
                    fetch('https://friends.roblox.com/v1/users/' + id + '/followings/count', { headers: UA }).then(r => r.json()).catch(() => null)
                ]);
                if (f && typeof f.count === 'number') stats.friends = f.count.toLocaleString('en-US');
                if (fol && typeof fol.count === 'number') stats.followers = fol.count.toLocaleString('en-US');
                if (fing && typeof fing.count === 'number') stats.following = fing.count.toLocaleString('en-US');
            } catch(e) {}
            return res.status(200).json({ ok: true, stats });
        }

        // ===== 7) ITEM & BAJU YANG DIPAKAI: /api/user?wearing=123 =====
        if (q.wearing) {
            const id = q.wearing;
            try {
                const r = await fetch('https://avatar.roblox.com/v1/users/' + id + '/avatar', { headers: UA });
                if (r.ok) {
                    const data = await r.json();
                    if (data && data.assets && data.assets.length > 0) {
                        const assets = data.assets.slice(0, 10);
                        const assetIds = assets.map(a => a.id);
                        const thumbRes = await fetch('https://thumbnails.roblox.com/v1/assets?assetIds=' + assetIds.join(',') + '&size=150x150&format=Png&isCircular=false', { headers: UA });
                        const thumbMap = {};
                        if (thumbRes.ok) {
                            const tData = await thumbRes.json();
                            if (tData && tData.data) {
                                tData.data.forEach(item => { if (item.imageUrl) thumbMap[item.targetId] = item.imageUrl; });
                            }
                        }
                        return res.status(200).json({
                            ok: true,
                            items: assets.map(a => ({ id: a.id, name: a.name || 'Item', image: thumbMap[a.id] || null })).filter(a => a.image)
                        });
                    }
                }
            } catch(e) {}
            return res.status(200).json({ ok: true, items: [] });
        }

        return res.status(400).json({ ok: false, error: 'parameter tidak dikenal' });
    } catch (e) {
        return res.status(200).json({ ok: false, error: 'upstream_error' });
    }
};
