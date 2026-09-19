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
        // Membersihkan komentar baris
        const cleanedScript = script.replace(/--.*$/gm, '').trim();
        
        // Menghasilkan kunci acak (1 - 255) untuk enkripsi XOR
        const key = Math.floor(Math.random() * 254) + 1;
        
        // Mengubah string menjadi byte array yang di-XOR
        const encodedBytes = [];
        for (let i = 0; i < cleanedScript.length; i++) {
            encodedBytes.push(cleanedScript.charCodeAt(i) ^ key);
        }
        
        const arrStr = encodedBytes.join(',');
        
        // MEMBUATNYA MULTI-LINE (Dipecah setiap ~80 angka agar tidak melewati batas panjang baris Roblox)
        const chunks = [];
        const chunkSize = 80; // Jumlah elemen per baris
        for (let i = 0; i < encodedBytes.length; i += chunkSize) {
            chunks.push(encodedBytes.slice(i, i + chunkSize).join(','));
        }
        
        // Menggabungkan array dengan enter (\n) di dalam kurung kurawal Lua
        const multiLineArray = chunks.join(',\n');

        // Membungkusnya menjadi beberapa baris yang aman dan bersih dari warning Studio
        const obfuscatedCode = `local d={\n${multiLineArray}\n}\nlocal r=""\nfor i=1,#d do\n    r=r..string.char(d[i]~=${key})\nend\nreturn loadstring(r)();`;

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
