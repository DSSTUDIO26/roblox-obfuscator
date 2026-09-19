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
        const key = Math.floor(Math.random() * 254) + 1;
        
        const encodedBytes = [];
        for (let i = 0; i < cleanedScript.length; i++) {
            const charCode = cleanedScript.charCodeAt(i);
            encodedBytes.push((charCode ^ key) & 0xFF);
        }
        
        const arrStr = encodedBytes.join(',');

        // Menggunakan metode fungsi bungkus (function wrapping) murni tanpa loadstring
        const obfuscatedCode = `local d={${arrStr}} local r="" for i=1,#d do r=r..string.char(bit32.bxor(d[i],${key})) end local f = assert(loadstring or load)(r); return f();`;

        if (process.env.DATABASE_URL) {
            try {
                const sql = neon(process.env.DATABASE_URL);
                await sql`CREATE TABLE IF NOT EXISTS obfuscate_logs (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
                await sql`INSERT INTO obfuscate_logs DEFAULT VALUES;`;
            } catch (dbError) {
                console.error("Database error (non-fatal):", dbError.message);
            }
        }

        return res.status(200).json({ success: true, result: obfuscatedCode });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
