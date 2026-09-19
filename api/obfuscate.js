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
        // Membersihkan komentar agar format 1 baris tidak rusak
        const cleanedScript = script.replace(/--.*$/gm, '').trim();
        
        // Mengubah karakter menjadi kode ASCII byte array agar menjadi 1 baris murni tanpa enter
        const bytes = [...cleanedScript].map(char => char.charCodeAt(0));
        
        // Membungkusnya dalam format 1 baris yang mengembalikan nilai (cocok untuk ModuleScript)
        const obfuscatedCode = `local b={${bytes.join(',')}} local s="" for _,v in ipairs(b) do s=s..string.char(v) end return loadstring(s)();`;

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
