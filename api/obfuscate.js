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
        const cleanedScript = script.replace(/--.*$/gm, '').trim();
        const encodedBytes = [...cleanedScript].map(char => '\\x' + char.charCodeAt(0).toString(16)).join('');
        
        // Pecah string panjang menjadi beberapa potongan kecil per 150 karakter agar aman dari batasan line Roblox
        const chunks = [];
        for (let i = 0; i < encodedBytes.length; i += 150) {
            chunks.push(`"${encodedBytes.slice(i, i + 150)}"`);
        }

        const obfuscatedCode = `local chunks = {${chunks.join(',')}}\n` +
                               `local d = table.concat(chunks)\n` +
                               `local success, res = pcall(function()\n` +
                               `    return loadstring(d:gsub('\\x(%x%x)', function(a) return string.char(tonumber(a, 16)) end))()\n` +
                               `end)\n` +
                               `if not success then warn("Obfuscation execution error: " .. tostring(res)) end`;

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
