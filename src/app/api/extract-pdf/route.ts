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

const SYSTEM_PROMPT = `Du är expert på svenska leverantörsfakturor. Läs ALLA sidor noga.

Extrahera exakt:
- invoice_number: Fakturanummer
- invoice_date: Fakturadatum (YYYY-MM-DD)
- due_date: Förfallodatum (YYYY-MM-DD)
- total_amount: Totalt att betala (inkl moms, nummer)
- vat_amount: Momsbelopp
- supplier: Leverantörens namn
- ocr_number: OCR-nummer (ofta längst ner)
- bankgiro: Bankgiro (ofta under betalningsinfo)
- customer_number: Kundnummer/referens
- vat_percentage: Momsprocent (t.ex. 25%)

Exempel på OCR/bankgiro: "OCR: 123456789" eller "Bankgiro 123-4567".

Svara ENDAST med giltig JSON, inga förklaringar.`;

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

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.type === 'application/pdf') {
        originalPdfBuffer = buffer;
        originalFileName = file.name;
      } else if (file.type.startsWith('image/')) {
        imageBase64s.push(`data:${file.type};base64,${buffer.toString('base64')}`);
      }
    }

    if (imageBase64s.length === 0) {
      return NextResponse.json({ error: 'Inga bilder att analysera' }, { status: 400 });
    }

    let parsed: any = {};
    try {
      const completion = await grok.chat.completions.create({
        model: 'grok-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text' as const, text: `Extrahera från ${imageBase64s.length} sidor:` },
              ...imageBase64s.map((url) => ({
                type: 'image_url' as const,
                image_url: { url },
              })),
            ],
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const raw = completion.choices[0].message.content?.trim() || '{}';
      parsed = JSON.parse(raw);
    } catch (err: any) {
      return NextResponse.json({ error: `Grok-fel: ${err.message}` }, { status: 500 });
    }

    let publicUrl = '';
    if (originalPdfBuffer && originalFileName) {
      const fileName = `${Date.now()}-${originalFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`invoices/${fileName}`, originalPdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) return NextResponse.json({ error: `Storage-fel: ${uploadError.message}` }, { status: 500 });

      publicUrl = supabase.storage.from('invoices').getPublicUrl(`invoices/${fileName}`).data.publicUrl;
    }

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
