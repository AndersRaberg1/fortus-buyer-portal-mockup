import { Groq } from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import axios from 'axios';
import FormData from 'form-data';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (files.length === 0 || !files[0]) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      console.log(`Bearbetar fil: ${file.name} (${file.size} bytes, type: ${file.type})`);

      const buffer = Buffer.from(await file.arrayBuffer());

      // OCR Space – auto-detect language
      const ocrForm = new FormData();
      ocrForm.append('file', buffer, file.name);
      ocrForm.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld');
      ocrForm.append('language', 'auto');
      ocrForm.append('OCREngine', '2');

      let ocrData;
      try {
        const ocrResponse = await axios.post('https://api.ocr.space/parse/image', ocrForm, {
          headers: ocrForm.getHeaders(),
          timeout: 90000,
        });
        ocrData = ocrResponse.data;
        console.log('OCR Space response:', JSON.stringify(ocrData));
      } catch (ocrErr: any) {
        console.error('OCR Space fel:', ocrErr.message);
        results.push({ error: `OCR fel: ${ocrErr.message}`, file: file.name });
        continue;
      }

      if (ocrData.IsErroredOnProcessing) {
        results.push({ error: ocrData.ErrorMessage?.join(' ') || 'OCR misslyckades', file: file.name });
        continue;
      }

      const fullText = ocrData.ParsedResults?.map((r: any) => r.ParsedText).join('\n') || '';
      if (!fullText.trim()) {
        results.push({ error: 'Ingen text extraherad', file: file.name });
        continue;
      }

      // Groq – bättre prompt för svenska fakturor (explicita termer + fallback)
      let parsed: any = {};
      let completion: any;
      try {
        completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: `Extrahera från denna svenska faktura och returnera ONLY ett giltigt JSON-objekt, ingen förklaring eller text utanför JSON. Använd svenska termer som "Fakturadatum", "Kundnummer", "Moms 25%", "Momspliktigt belopp", "Momsbelopp". Fält: { "invoice_number": "...", "invoice_date": "YYYY-MM-DD" (Fakturadatum), "due_date": "YYYY-MM-DD" (Förfallodatum/Betalas senast), "total_amount": "...", "vat_amount": "..." (Momsbelopp), "vat_percentage": "..." (Moms%), "customer_number": "..." (Kundnummer), "supplier": "...", "ocr_number": "...", "bankgiro": "...", "line_items": [{"description": "...", "amount": "..."}] }. Text: ${fullText.substring(0, 12000)}`,
            },
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0,
          max_tokens: 1024,
        });
        let rawContent = completion.choices[0]?.message?.content || '{}';
        console.log('Groq raw response:', rawContent);

        // Säker trim av code block
        rawContent = rawContent.trim();
        if (rawContent.startsWith('```json')) rawContent = rawContent.slice(7).trimStart();
        if (rawContent.startsWith('```')) rawContent = rawContent.slice(3).trimStart();
        if (rawContent.endsWith('```')) rawContent = rawContent.slice(0, -3).trimEnd();

        parsed = JSON.parse(rawContent);
        console.log('Groq parsed:', parsed);
      } catch (e: any) {
        console.error('Groq fel:', e.message);
        parsed = { error: 'JSON-parse misslyckades', raw: completion?.choices[0]?.message?.content || 'Ingen raw' };
      }

      // Storage upload
      const fileName = `${parsed.invoice_number || Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, buffer, { contentType: file.type || 'application/pdf', upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        parsed.upload_error = uploadError.message;
        parsed.pdf_url = null;
      } else {
        const { data: signedUrlData } = await supabase.storage
          .from('invoices')
          .createSignedUrl(fileName, 60 * 60);

        parsed.pdf_url = signedUrlData?.signedUrl || null;
      }

      // DB upsert – fallback för nya fält
      const { error: dbError } = await supabase.from('invoices').upsert({
        invoice_number: parsed.invoice_number?.toString(),
        invoice_date: parsed.invoice_date,
        amount: parsed.total_amount?.toString(),
        due_date: parsed.due_date,
        vat_amount: parsed.vat_amount?.toString(),
        vat_percentage: parsed.vat_percentage?.toString(),
        customer_number: parsed.customer_number?.toString(),
        supplier: parsed.supplier || 'Okänd',
        ocr_number: parsed.ocr_number?.toString(),
        bankgiro: parsed.bankgiro?.toString(),
        pdf_url: parsed.pdf_url,
      });

      if (dbError) console.error('DB error:', dbError);

      results.push(parsed);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('API route error:', err.message, err.stack);
    return NextResponse.json({ error: err.message || 'Serverfel' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;
