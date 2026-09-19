import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { script } = req.body;
    if (!script) {
        return res.status(400).json({ success: false, message: 'Script tidak boleh kosong!' });
    }

    try {
        // Obfuscasi ringan yang aman untuk Luau Roblox (menghindari error baris terlalu panjang)
        // Melakukan minifikasi dasar dan enkripsi string bertahap agar tidak merusak fungsi game.
        const cleanedScript = script.replace(/--.*$/gm, ''); // Hapus komentar untuk meringankan baris
        const encodedBytes = [...cleanedScript].map(char => '\\x' + char.charCodeAt(0).toString(16)).join('');
        
        const obfuscatedCode = `-- [ Protected by Dragon Stell Obfuscator ] --\n` +
                               `local encoded_data = "${encodedBytes}"\n` +
                               `local function decode(data)\n` +
                               `    return (data:gsub('\\x(%x%x)', function(digits)\n` +
                               `        return string.char(tonumber(digits, 16))\n` +
                               `    end))\n` +
                               `end\n` +
                               `local success, result = pcall(function()\n` +
                               `    return loadstring(decode(encoded_data))()\n` +
                               `end)\n` +
                               `if not success then warn("Obfuscation error: " .. tostring(result)) end`;

        // Simpan log ke database Neon (Opsional jika DATABASE_URL diset)
        if (process.env.DATABASE_URL) {
            const sql = neon(process.env.DATABASE_URL);
            await sql`CREATE TABLE IF NOT EXISTS obfuscate_logs (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
            await sql`INSERT INTO obfuscate_logs DEFAULT VALUES;`;
        }

        return res.status(200).json({ success: true, result: obfuscatedCode });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
