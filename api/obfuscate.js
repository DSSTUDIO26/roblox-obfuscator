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
        // Membersihkan komentar dan merapikan spasi berlebih tanpa merusak struktur kode asli
        let minified = script
            .replace(/--\[\[[\s\S]*?--\]\]/g, '') // Hapus komentar blok
            .replace(/--.*$/gm, '')               // Hapus komentar baris
            .replace(/\s+/g, ' ')                 // Ubah spasi ganda/enter menjadi spasi tunggal
            .trim();

        // Menambahkan header pelindung ringan yang aman untuk modul Roblox
        const obfuscatedCode = `-- [ Protected by Custom Backend Minifier ] --\n` + minified;

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
