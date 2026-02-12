import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `Du är expert på svenska leverantörsfakturor. Extrahera exakt dessa fält och svara ENDAST med giltig JSON (inga förklaringar):
{
  "invoice_number": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "total_amount": number | null,
  "vat_amount": number | null,
  "supplier": string | null,
  "ocr_number": string | null,
  "bankgiro": string | null,
  "customer_number": string | null,
  "vat_percentage": string | null
}`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: 'Inga filer uppladdade' }, { status: 400 });
    }

    let originalPdfBuffer: Buffer | null = null;
    let originalFileName: string | null = null;
    let imageBase64s: string[] = [];
    let textContent = '';

    // Samla data från filer
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === 'application/pdf') {
        originalPdfBuffer = buffer;
        originalFileName = file.name;
        // Försök text-extraction (dynamisk import för att undvika Turbopack-fel)
        try {
          const pdfParseLib = await import('pdf-parse');
          const pdfData = await pdfParseLib.default(buffer);
          textContent = pdfData.text.trim();
          console.log(`Text extraherad: ${textContent.length} tecken`);
        } catch (err) {
          console.log('Text-extraction misslyckades – fallback till vision');
        }
      } else if (file.type.startsWith('image/')) {
        imageBase64s.push(`data:${file.type};base64,${buffer.toString('base64')}`);
      }
    }

    // Grok-parsing
    let parsed: any = {};
    try {
      let completion;
      if (textContent.length > 500) {
        // Bra text → använd text-modell (snabbt, ingen konvertering)
        completion = await grok.chat.completions.create({
          model: 'grok-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: textContent },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        });
      } else if (imageBase64s.length > 0) {
        // Fallback till vision
        completion = await grok.chat.completions.create({
          model: 'grok-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Extrahera från ${imageBase64s.length} sidor:` },
                ...imageBase64s.map(url => ({ type: 'image_url', image_url: { url } })),
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        });
      } else {
        throw new Error('Ingen läsbar data i filen');
      }

      const raw = completion.choices[0].message.content?.trim() || '{}';
      parsed = JSON.parse(raw);
    } catch (err: any) {
      return NextResponse.json({ error: `Grok-fel: ${err.message}` }, { status: 500 });
    }

    // Spara original PDF
    let publicUrl = '';
    if (originalPdfBuffer && originalFileName) {
      const fileName = `${Date.now()}-${originalFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`invoices/${fileName}`, originalPdfBuffer, { contentType: 'application/pdf', upsert: true });

      if (uploadError) {
        return NextResponse.json({ error: `Storage-fel: ${uploadError.message}` }, { status: 500 });
      }
      publicUrl = supabase.storage.from('invoices').getPublicUrl(`invoices/${fileName}`).data.publicUrl;
    }

    // Spara till DB
    const { error: dbError } = await supabase.from('invoices').upsert({
      ...parsed,
      amount: parsed.total_amount ?? null, // Anpassa till dina kolumner
      pdf_url: publicUrl,
    });

    if (dbError) {
      return NextResponse.json({ error: `DB-fel: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed, pdf_url: publicUrl });
  } catch (error: any) {
    console.error('FEL:', error);
    return NextResponse.json({ error: error.message || 'Serverfel' }, { status: 500 });
  }
}
