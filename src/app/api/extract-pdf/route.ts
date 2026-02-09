import { NextRequest } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Secret key för server-side (säker)
);

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
  ocrForm.append('OCREngine', '2');
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

    // Din befintliga parsing (perfekt för Telavox – kopiera från senaste fungerande version)

    const parsed = {
      amount: amount !== 'Ej hittat' ? `${amount} kr` : 'Ej hittat',
      dueDate,
      supplier,
      invoiceNumber,
      ocrNumber,
    };

    // Spara PDF i Storage
    const fileName = `faktura_${Date.now()}.pdf`;
    const { error: storageError } = await supabase.storage
      .from('invoices')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);

    // Spara i tabell
    const { error: dbError } = await supabase
      .from('invoices')
      .insert({ parsed_data: parsed, pdf_url: publicUrl });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({
      parsed,
      message: 'Faktura sparad i Supabase!',
      pdfUrl: publicUrl,
    }), { status: 200 });
  } catch (err: any) {
    console.error('Error:', err.message);
    return new Response(JSON.stringify({ error: err.message || 'Misslyckades' }), { status: 500 });
  }
}