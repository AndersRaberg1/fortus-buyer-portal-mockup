import { NextRequest } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'Ingen fil uppladdad' }), { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ocrForm = new FormData();
  ocrForm.append('apikey', process.env.OCR_SPACE_API_KEY || '');
  ocrForm.append('language', 'auto');
  ocrForm.append('OCREngine', '2'); // Snabb + bra accuracy, ingen timeout
  ocrForm.append('isTable', 'true');
  ocrForm.append('scale', 'true');
  ocrForm.append('detectOrientation', 'true');
  ocrForm.append('file', buffer, {
    filename: file.name || 'faktura.pdf',
    contentType: file.type || 'application/pdf',
  });

  try {
    const ocrResponse = await axios.post('https://api.ocr.space/parse/image', ocrForm, {
      headers: ocrForm.getHeaders(),
      timeout: 60000,
    });

    const ocrData = ocrResponse.data;

    if (ocrData.IsErroredOnProcessing || ocrData.OCRExitCode !== 1) {
      throw new Error(ocrData.ErrorMessage?.join(' ') || `OCR-fel (kod: ${ocrData.OCRExitCode})`);
    }

    const fullText = ocrData.ParsedResults.map((r: any) => r.ParsedText).join('\n');

    // Perfekt parsing för Telavox + vanliga svenska fakturor
    const amount = fullText.match(/Kvar att Betala \(SEK\) ([\d.,]+)/i)?.[1]?.replace(',', '.') ||
                   fullText.match(/Belopp ([\d.,]+)/i)?.[1]?.replace(',', '.') ||
                   fullText.match(/(att betala|totalt|summa|belopp|slutsumm a|totalbelopp)[\s:]*([\d\s.,]+)[\s]*(kr|sek|kronor)/i)?.[2]?.replace(/\s/g, '').replace(',', '.') ||
                   'Ej hittat';

    const dueDate = fullText.match(/Förfallodatum ([\d-]{10})/i)?.[1] || 'Ej hittat';

    const supplier = fullText.match(/TELAVOX/i) ? 'Telavox AB' : // Logo/text indikerar Telavox
                     fullText.match(/Betalningsmottagare ([\w\s]+AB)/i)?.[1]?.trim() ||
                     fullText.match(/(leverantör|säljar|från|avsändare)[\s:]*([a-za-zåäöÅÄÖ\s\d]+(?:ab|hb|kb|aktiebolag))/i)?.[2]?.trim() ||
                     'Ej hittat';

    const invoiceNumber = fullText.match(/Fakturanummer ([\d]+)/i)?.[1] ||
                          fullText.match(/Faktura ([\d]+)/i)?.[1] || 'Ej hittat';

    const ocrNumber = fullText.match(/Till bankgironr ([\d-]+)/i)?.[1]?.replace(/-/g, '') ||
                      fullText.match(/bankgironr ([\d-]+)/i)?.[1]?.replace(/-/g, '') ||
                      fullText.match(/OCR ([\d#]+)/i)?.[1]?.replace(/#/g, '') ||
                      'Ej hittat';

    return new Response(JSON.stringify({
      fullText: fullText.substring(0, 3000) + '...', // Debug: visa rå OCR-text
      parsed: {
        amount: amount !== 'Ej hittat' ? `${amount} kr` : 'Ej hittat',
        dueDate,
        supplier,
        invoiceNumber,
        ocrNumber,
      },
    }), { status: 200 });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    return new Response(JSON.stringify({ error: err.message || 'OCR misslyckades' }), { status: 500 });
  }
}