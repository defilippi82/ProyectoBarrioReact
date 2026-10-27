// api/prefectura.js (Ejemplo para Vercel Serverless / Node.js)
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  try {
    const url = 'https://contenidosweb.prefecturanaval.gob.ar/alturas/?page=historico&tiempo=7&id=360';
    const response = await fetch(url);
    const html = await response.text();
    
    const $ = cheerio.load(html);
    const registros = [];

    // Buscamos las filas de la tabla histórica de Prefectura
    $('table tr').each((i, row) => {
      const cols = $(row).find('td');
      if (cols.length >= 3) {
        const fechaHora = $(cols[0]).text().trim();
        const altura = parseFloat($(cols[1]).text().trim().replace(',', '.'));
        const estado = $(cols[2]).text().trim();

        if (!isNaN(altura)) {
          registros.push({ fechaHora, altura, estado });
        }
      }
    });

    return res.status(200).json({ success: true, registros });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}