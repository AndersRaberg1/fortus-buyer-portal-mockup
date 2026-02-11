import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const VISION_PROMPT = `
Du är en expert på svenska fakturor, särskilt Telavox-fakturor. Analysera bilden/PDF och extrahera följande fält som JSON (ENDAST JSON, ingen annan text):

{
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "vat_amount": number | null,
  "net_amount": number | null,
  "currency": "SEK",
  "supplier_name": string | null,
  "supplier_org_number": string | null,
  "buyer_name": string | null,
  "buyer_org_number": string | null,
  "ocr_number": string | null,
  "bankgiro": string | null,
  "line_items": array of {description: string, quantity: number | null, unit_price: number | null, total: number | null}
}

Använd kontext för att korrigera fel. Prioritera Telavox-format (t.ex. invoice_number från fakturanummer eller OCR-rad, total_amount från "Kvar att Betala", line_items från tabell).
`;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'application/octet-stream';
      const imageData = `data:${mimeType};base64,${base64}`;

      const completion = await groq.chat.completions.create({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              { type: 'image_url', image_url: { url: imageData } },
            ],
          },
        ],
        temperature: 0,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      });

      let parsed = {};
      try {
        parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (e) {
        parsed = { error: 'Ogiltig JSON från AI' };
      }

      const fileName = `${parsed.invoice_number || Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error: storageError } = await supabase.storage
        .from('invoices')
        .upload(fileName, buffer, { contentType: file.type, upsert: true });

      if (storageError) {
        results.push({ fileName: file.name, error: storageError.message });
        continue;
      }

      const { data: { publicUrl: pdfUrl } } = supabase.storage.from('invoices').getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('invoices')
        .upsert({
          invoice_number: parsed.invoice_number,
          amount: parsed.total_amount,
          due_date: parsed.due_date,
          supplier: parsed.supplier_name,
          ocr_number: parsed.ocr_number,
          bankgiro: parsed.bankgiro,
          pdf_url: pdfUrl,
          full_parsed_data: parsed,
        }, { onConflict: 'invoice_number' });

      if (dbError) {
        results.push({ fileName: file.name, error: dbError.message });
        continue;
      }

      results.push({
        fileName: file.name,
        parsed,
        pdfUrl,
        success: true,
      });
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || 'Serverfel' }, { status: 500 });
  }
}