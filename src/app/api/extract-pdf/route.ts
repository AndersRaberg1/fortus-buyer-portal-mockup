import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const ocrForm = new FormData();
    ocrForm.append('file', buffer, file.name);
    ocrForm.append('apikey', process.env.OCR_SPACE_API_KEY || '');
    ocrForm.append('language', 'auto');
    ocrForm.append('OCREngine', '2');
    ocrForm.append('scale', 'true');
    ocrForm.append('isOverlayRequired', 'false');

    const ocrResponse = await axios.post('https://api.ocr.space/parse/image', ocrForm, {
      headers: ocrForm.getHeaders(),
      timeout: 120000,
    });

    const ocrData = ocrResponse.data;

    if (ocrData.IsErroredOnProcessing || !ocrData.ParsedResults?.[0]) {
      throw new Error(ocrData.ErrorMessage?.join(' ') || 'OCR misslyckades');
    }

    const fullText = ocrData.ParsedResults.map((r: any) => r.ParsedText).join('\n');

    let amount = 'Ej hittat';
    let dueDate = 'Ej hittat';
    let supplier = 'Telavox AB';
    let invoiceNumber = 'Ej hittat';
    let ocrNumber = 'Ej hittat';
    let bankgiro = 'Ej hittat';

    // Belopp – flexibel för din nya layout
    const amountMatch = fullText.match(/(?:Summa|Kvar att Betala)[\s\S]*?\(SEK\)\s*([\d\s,]+)(?:\.\d+)?/i);
    if (amountMatch) {
      amount = amountMatch[1].trim().replace(/\s/g, '').replace(',', '.') + ' kr';
    }

    // Förfallodatum – prioriterar avi ("Förfallodatum 2026-02-26"), undviker period
    const dueAviMatch = fullText.match(/Förfallodatum[\s\S]*?([\d]{4}-[\d]{2}-[\d]{2})/i);
    if (dueAviMatch && !fullText.match(new RegExp(dueAviMatch[1] + '.*period', 'i'))) {
      dueDate = dueAviMatch[1];
    }

    // Fakturanummer
    const invoiceMatch = fullText.match(/Fakturanummer[\s\S]*?(\d{10,})/i);
    if (invoiceMatch) invoiceNumber = invoiceMatch[1];

    // Bankgiro
    const bgMatch = fullText.match(/(\d{4}-\d{4})/g);
    if (bgMatch) bankgiro = bgMatch[0];

    // OCR-nummer – exakt för din bottensträng
    const ocrLongMatch = fullText.match(/(\d{10,})\s*#\s*[\d\s]+\s*3\s*>\s*\d{8}/i);
    if (ocrLongMatch) {
      ocrNumber = ocrLongMatch[1];
      if (invoiceNumber === 'Ej hittat') invoiceNumber = ocrLongMatch[1];
    }

    const parsed = {
      amount,
      dueDate,
      supplier,
      invoiceNumber,
      ocrNumber,
      bankgiro,
    };

    const fileName = `${parsed.invoiceNumber || Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const { error: storageError } = await supabase.storage
      .from('invoices')
      .upload(fileName, buffer, { contentType: file.type, upsert: true });

    if (storageError) throw storageError;

    const { data: { publicUrl: pdfUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);

    // Upsert i DB (uppdaterar om invoice_number finns, annars insert)
    const { error: dbError } = await supabase
      .from('invoices')
      .upsert({
        invoice_number: parsed.invoiceNumber, // Unique key
        amount: parsed.amount,
        due_date: parsed.dueDate,
        supplier: parsed.supplier,
        ocr_number: parsed.ocrNumber,
        bankgiro: parsed.bankgiro,
        pdf_url: pdfUrl,
      }, { onConflict: 'invoice_number' });

    if (dbError) throw dbError;

    return NextResponse.json({ parsed, pdfUrl, success: true });

  } catch (err: any) {
    console.error('Fel:', err);
    return NextResponse.json({ error: err.message || 'Något gick fel' }, { status: 500 });
  }
}