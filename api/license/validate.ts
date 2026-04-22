import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 1, // Minimize concurrent connection drain in Vercel
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { key, hwid } = req.body;
    
    // Validate existence of the key
    const result = await pool.query('SELECT * FROM "keys" WHERE key_value = $1', [key]);
    
    if (result.rows.length === 0) {
      return res.status(200).json({ valid: false, message: 'Chave inválida ou inexistente. Entre em contato com o suporte!' });
    }

    const license = result.rows[0];
    
    // First time use: register HWID
    if (!license.hwid) {
      await pool.query('UPDATE "keys" SET hwid = $1 WHERE key_value = $2', [hwid, key]);
      return res.status(200).json({ valid: true });
    }
    
    // Validate existing HWID
    if (license.hwid !== hwid) {
      return res.status(200).json({ valid: false, message: 'Chave já registrada em outro dispositivo. Contate o suporte.' });
    }

    // Expiry check
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, message: 'Ops, Sua Licença Expirou!' });
    }

    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error("Erro Vercel Validate:", error);
    return res.status(500).json({ error: 'Erro de conexao no servidor. Causa: Tabela keys com erro', message: String(error) });
  }
}
