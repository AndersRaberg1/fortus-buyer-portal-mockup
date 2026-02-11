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

      // OCR Space
      const ocrForm = new FormData();
      ocrForm.append('file', buffer, file.name);
      ocrForm.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld'); // Fallback för test
      ocrForm.append('language', 'swe');
      ocrForm.append('OCREngine', '2');

      let ocrData;
      try {
        const ocrResponse = await axios.post('https://api.ocr.space/parse/image', ocrForm, {
          headers: ocrForm.getHeaders(),
          timeout: 90000, // Längre timeout
        });
        ocrData = ocrResponse.data;
        console.log('OCR Space response:', ocrData);
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
        results.push({ error: 'Ingen text extraherad från filen', file: file.name });
        continue;
      }

      // Groq parsing
      let parsed = {};
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: `Extrahera exakt från denna Telavox-faktura som JSON: invoice_number, due_date (YYYY-MM-DD), total_amount, supplier, ocr_number, bankgiro, line_items (array med description och amount). Text: ${fullText.substring(0, 12000)}`,
            },
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0,
          max_tokens: 1024,
        });
        parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        console.log('Groq parsed:', parsed);
      } catch (groqErr: any) {
        console.error('Groq fel:', groqErr.message);
        parsed = { error: `Groq fel: ${groqErr.message}` };
      }

      // Storage + DB (oförändrad)
      const fileName = `${parsed.invoice_number || Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage.from('invoices').upload(fileName, buffer, { contentType: file.type || 'application/pdf', upsert: true });

      if (uploadError) parsed.upload_error = uploadError.message;

      const { data: signedUrlData } = await supabase.storage.from('invoices').createSignedUrl(fileName, 60 * 60);
      parsed.pdf_url = signedUrlData?.signedUrl || null;

      const { error: dbError } = await supabase.from('invoices').upsert({
        invoice_number: parsed.invoice_number,
        amount: parsed.total_amount,
        due_date: parsed.due_date,
        supplier: parsed.supplier || 'Telavox AB',
        ocr_number: parsed.ocr_number,
        bankgiro: parsed.bankgiro,
        pdf_url: parsed.pdf_url,
        full_parsed_data: parsed,
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
