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
  ocrForm.append('OCREngine', '3');
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
    });

    const ocrData = ocrResponse.data;

    if (ocrData.IsErroredOnProcessing || ocrData.OCRExitCode !== 1) {
      throw new Error(ocrData.ErrorMessage?.join(' ') || `OCR-fel (kod: ${ocrData.OCRExitCode})`);
    }

    const fullText = ocrData.ParsedResults.map((r: any) => r.ParsedText).join('\n');

    // Superrobust parsing för svenska fakturor (inkl Telavox)
    const amountMatch = fullText.match(/(kvar att betala|att betala|totalt|summa|belopp|slutsumm a|totalbelopp|summa \(sek\))[\s:]*([\d\s.,]+)[\s]*(kr|sek|kronor)/i);
    const amount = amountMatch ? amountMatch[2].replace(/\s/g, '').replace(',', '.') : 'Ej hittat';

    const dueDateMatch = fullText.match(/(förfallodatum|förfaller|betala senast|due date|betalas senast)[\s:]*(\d{4}-\d{2}-\d{2}|\d{2}[\/.-]\d{2}[\/.-]\d{4})/i);
    const dueDate = dueDateMatch ? dueDateMatch[2] : 'Ej hittat';

    const supplierMatch = fullText.match(/(betalningsmottagare|leverantör|säljar|från|avsändare|supplier)[\s:]*([a-za-zåäöÅÄÖ\s\d]+(?:ab|hb|kb|aktiebolag|as|ltd|inc|group))/i);
    const supplier = supplierMatch ? supplierMatch[2].trim() : 'Ej hittat';

    const invoiceNumberMatch = fullText.match(/(fakturanummer|faktura nr|fakturanr|invoice no|invoice number|faktura#)[\s:]*([\d]+)/i);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[2] : 'Ej hittat';

    const ocrNumberMatch = fullText.match(/(bankgiro|bg|plusgiro|ocr|ocr-nr|ocr nummer)[\s:]*([\d\s-]+)/i);
    const ocrNumber = ocrNumberMatch ? ocrNumberMatch[2].replace(/\s|-|#|/g, '') : 'Ej hittat';

    return new Response(JSON.stringify({
      fullText: fullText.substring(0, 3000) + '...', // Debug: Visa rå OCR-text
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