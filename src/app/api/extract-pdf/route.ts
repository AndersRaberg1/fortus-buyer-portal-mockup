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

    // Samla filer: bilder + original PDF
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
      return NextResponse.json({ error: 'Inga bilder att analysera – ladda upp PDF eller bild' }, { status: 400 });
    }

    // Alltid Grok Vision (klienten skickar renderade sidor som bilder)
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
              ...imageBase64s.map(url => ({
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

    // Spara original PDF
    let publicUrl = '';
    if (originalPdfBuffer && originalFileName) {
      const fileName = `${Date.now()}-${originalFileName}`;
      const { error: uploadError } = await supabase
