// api/login.js — Setting Akun Member Manual di GitHub
const MEMBERS = [
    { username: "Jirun", password: "JirunSmd27-", name: "ROBUX STORE", balance: 50000 },
    { username: "member10", password: "pass123", name: "Member 10", balance: 40000 }
];

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { 
        res.status(200).end(); 
        return; 
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(200).json({ ok: false, message: 'Harap isi username dan password!' });
        }

        const user = MEMBERS.find(m => 
            m.username.toLowerCase() === username.trim().toLowerCase() && 
            m.password === password.trim()
        );

        if (user) {
            return res.status(200).json({
                ok: true,
                user: {
                    name: user.name,
                    balance: user.balance,
                    token: Buffer.from(user.username + ':' + Date.now()).toString('base64')
                }
            });
        } else {
            return res.status(200).json({ 
                ok: false, 
                message: 'Akses ditolak! Username atau Password salah.' 
            });
        }
    } catch (e) {
        return res.status(500).json({ ok: false, error: 'Server error' });
    }
};
