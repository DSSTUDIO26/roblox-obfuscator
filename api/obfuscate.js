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
        
        // Menghasilkan kunci acak (1 - 255) untuk enkripsi XOR agar angka terlihat acak
        const key = Math.floor(Math.random() * 254) + 1;
        
        // Mengubah string menjadi byte array lalu di-XOR dengan key supaya angkanya tampak acak
        const encodedBytes = [...cleanedScript].map(char => char.charCodeAt(0) ^ key);
        
        const arrStr = encodedBytes.join(',');
        
        // Membungkusnya menjadi 1 baris murni yang aman untuk ModuleScript (menggunakan return loadstring)
        const obfuscatedCode = `local d={${arrStr}} local r="" for i=1,#d do r=r..string.char(d[i]~=${key}) end return loadstring(r)();`;

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
