import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import * as pdfjs from 'pdfjs-dist';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `Du är expert på svenska leverantörsfakturor. Extrahera exakt dessa fält och svara ENDAST med giltig JSON:
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

    // Samla data
    for (const file of files) {
      const loader = await file.arrayBuffer();
      const buffer = Buffer.from(loader);

      if (file.type === 'application/pdf') {
        originalPdfBuffer = buffer;
        originalFileName = file.name;

        // Server-side text-extraction med pdfjs-dist
        try {
          const loadingTask = pdfjs.getDocument({ data: buffer });
          const pdfDocument = await loadingTask.promise;
          let fullText = '';

          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const content = await page.getTextContent();
            const pageText = content.items.map((item: any) => (item.str || '')).join(' ');
            fullText += pageText + ' ';
          }

          textContent = fullText.trim();
          console.log(`Text extraherad (pdfjs): ${textContent.length} tecken`);
        } catch (err) {
          console.log('Text-extraction misslyckades – fallback till vision');
        }
      } else if (file.type.startsWith('image/')) {
        imageBase64s.push(`data:${file.type};base64,${buffer.toString('base64')}`);
      }
    }

    // Grok-parsing (hybrid)
    let parsed: any = {};
    try {
      let completion;
      if (textContent.length > 500) {
        // Digital PDF → text-parsing
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
        // Skannad → vision (fixad type-narrowing)
        completion = await grok.chat.completions.create({
          model: 'grok-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text' as const, text: `Extrahera från ${imageBase64s.length} sidor:` },
                ...imageBase64s.map(url => ({
                  type: 'image_url' as 'image_url',  // <-- Type-narrowing fix
                  image_url: { url },
                })),
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        });
      } else {
        throw new Error('Ingen läsbar data');
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

      if (uploadError) return NextResponse.json({ error: `Storage-fel: ${uploadError.message}` }, { status: 500 });

      publicUrl = supabase.storage.from('invoices').getPublicUrl(`invoices/${fileName}`).data.publicUrl;
    }

    // Spara till DB
    const { error: dbError } = await supabase.from('invoices').upsert({
      invoice_number: parsed.invoice_number ?? null,
      invoice_date: parsed.invoice_date ?? null,
      due_date: parsed.due_date ?? null,
      amount: parsed.total_amount ?? null,
      vat_amount: parsed.vat_amount ?? null,
      supplier: parsed.supplier ?? null,
      ocr_number: parsed.ocr_number ?? null,
      bankgiro: parsed.bankgiro ?? null,
      customer_number: parsed.customer_number ?? null,
      vat_percentage: parsed.vat_percentage ?? null,
      pdf_url: publicUrl,
    });

    if (dbError) return NextResponse.json({ error: `DB-fel: ${dbError.message}` }, { status: 500 });

    return NextResponse.json({ success: true, data: parsed, pdf_url: publicUrl });
  } catch (error: any) {
    console.error('Serverfel:', error);
    return NextResponse.json({ error: error.message || 'Serverfel' }, { status: 500 });
  }
}
