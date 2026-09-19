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
        
        // Menggunakan Base64 encoding agar struktur kode, fungsi, dan karakter khusus tetap aman
        const encodedData = Buffer.from(cleanedScript, 'utf-8').toString('base64');
        
        // Fungsi decoder Base64 murni berbasis Lua untuk Luau Roblox
        const obfuscatedCode = `local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\n` +
                               `local function decode(data)\n` +
                               `    data = string.gsub(data, '[^'..b..'=]', '')\n` +
                               `    return (data:gsub('.', function(x)\n` +
                               `        if (x == '=') then return '' end\n` +
                               `        local r,f='',(b:find(x)-1)\n` +
                               `        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end\n` +
                               `        return r\n` +
                               `    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)\n` +
                               `        if (#x ~= 8) then return '' end\n` +
                               `        local c=0\n` +
                               `        for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end\n` +
                               `        return string.char(c)\n` +
                               `    end))\n` +
                               `end\n` +
                               `local encoded = "${encodedData}"\n` +
                               `local fn, err = loadstring(decode(encoded))\n` +
                               `if not fn then warn("Loadstring error: " .. tostring(err)) return nil end\n` +
                               `return fn()`;

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
