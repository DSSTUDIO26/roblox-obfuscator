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
        // Membersihkan komentar agar kode bersih
        const cleanedScript = script.replace(/--.*$/gm, '').trim();
        
        // Mengubah setiap karakter script menjadi kode angka ASCII (byte array)
        const bytes = [...cleanedScript].map(char => char.charCodeAt(0));
        
        // Memecah deretan angka menjadi beberapa baris kecil (misal 20 angka per baris) agar tidak terkena limit Roblox
        const chunkedBytes = [];
        for (let i = 0; i < bytes.length; i += 20) {
            chunkedBytes.push(bytes.slice(i, i + 20).join(','));
        }
        
        const chunksString = chunkedBytes.map(chunk => `    ${chunk},`).join('\n');

        // Membungkus angka-angka tersebut dengan interpreter aman yang mengembalikan 'return' untuk ModuleScript
        const obfuscatedCode = 
`-- [ Encrypted Byte Array Obfuscator ] --
local t = {
${chunksString}
}
local b = {}
for i = 1, #t do
    b[i] = string.char(t[i])
end
local code = table.concat(b)
local fn, err = loadstring(code)
if not fn then
    warn("Obfuscation Error: " .. tostring(err))
    return nil
end
return fn()`;

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
