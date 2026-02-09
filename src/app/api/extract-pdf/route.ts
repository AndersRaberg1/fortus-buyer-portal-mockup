import { NextRequest } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: 'Ingen fil uppladdad' }), { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');

  // Force PDF för fakturor
  let mimeType = file.type || 'application/pdf';
  if (file.name?.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';

  const params = new URLSearchParams();
  params.append('base64Image', `data:${mimeType};base64,${base64}`);
  params.append('language', 'swe'); // Korrekta koden för svenska
  params.append('OCREngine', '3');
  params.append('isTable', 'true');
  params.append('scale', 'true');
  params.append('detectOrientation', 'true');
  params.append('filetype', 'PDF'); // Fixar E216

  try {
    const ocrResponse = await axios.post('https://api.ocr.space/parse/image', params, {
      headers: {
        'apikey': process.env.OCR_SPACE_API_KEY || '',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const ocrData = ocrResponse.data;

    if (ocrData.IsErroredOnProcessing || ocrData.OCRExitCode !== 1) {
      throw new Error(ocrData.ErrorMessage?.join(' ') || `OCR-fel (kod: ${ocrData.OCRExitCode})`);
    }

    const fullText = ocrData.ParsedResults.map((r: any) => r.ParsedText).join('\n').toLowerCase();

    // Samma parsing som innan
    const amount = fullText.match(/(kvar att betala|att betala|totalt|belopp|summa)[\s:]*([\d\s.,]+)[\s]*(kr|sek)/i)?.[2]?.replace(/\s/g, '').replace(',', '.') || 'Ej hittat';
    const dueDate = fullText.match(/(förfallodatum|förfaller|betala senast)[\s:]*(\d{4}-\d{2}-\d{2}|\d{2}[\/.-]\d{2}[\/.-]\d{4})/i)?.[2] || 'Ej hittat';
    const supplier = fullText.match(/(leverantör|säljar|from|avsändare)[\s:]*([a-za-zåäö\s\d]+(?:ab|hb|kb|aktiebolag|as|ltd|inc))/i)?.[2]?.trim() || 'Ej hittat';
    const invoiceNumber = fullText.match(/(fakturanr|faktura nr|fakturanummer|invoice no)[\s:]*([\d]+)/i)?.[2] || 'Ej hittat';
    const ocrNumber = fullText.match(/(ocr|ocr-nr|ocr nummer)[\s:]*([\d]+)/i)?.[2] || 'Ej hittat';

    return new Response(JSON.stringify({
      fullText: fullText.substring(0, 2000) + '...',
      parsed: {
        amount: amount !== 'Ej hittat' ? `${amount} kr` : 'Ej hittat',
        dueDate,
        supplier: supplier !== 'Ej hittat' ? supplier.charAt(0).toUpperCase() + supplier.slice(1) : 'Ej hittat',
        invoiceNumber,
        ocrNumber,
      },
    }), { status: 200 });
  } catch (err: any) {
    console.error('OCR Error:', err.message);
    return new Response(JSON.stringify({ error: err.message || 'OCR misslyckades' }), { status: 500 });
  }
}