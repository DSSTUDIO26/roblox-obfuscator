import { neon } from '@neondatabase/serverless';

// Mengatur batas ukuran body jika menggunakan framework tertentu, 
// tapi di Vercel batas default body JSON adalah 4.5MB.
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
        
        // Menggunakan perulangan biasa (for loop) lebih aman untuk memori string besar dibanding spread operator [...]
        const encodedBytes = [];
        for (let i = 0; i < cleanedScript.length; i++) {
            encodedBytes.push(cleanedScript.charCodeAt(i) ^ key);
        }
        
        const arrStr = encodedBytes.join(',');
        
        // Membungkusnya menjadi 1 baris murni
        const obfuscatedCode = `local d={${arrStr}} local r="" for i=1,#d do r=r..string.char(d[i]~=${key}) end return loadstring(r)();`;

        // Koneksi database dengan pengecekan aman
        if (process.env.DATABASE_URL) {
            try {
                const sql = neon(process.env.DATABASE_URL);
                await sql`CREATE TABLE IF NOT EXISTS obfuscate_logs (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
                await sql`INSERT INTO obfuscate_logs DEFAULT VALUES;`;
            } catch (dbError) {
                console.error("Database error (non-fatal):", dbError.message);
                // Lanjutkan eksekusi meskipun database gagal, agar obfuscator tetap mengembalikan hasil
            }
        }

        return res.status(200).json({ success: true, result: obfuscatedCode });
    } catch (error) {
        console.error("Obfuscation error:", error);
        return res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan pada server.' });
    }
}
