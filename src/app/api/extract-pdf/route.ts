import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const VISION_PROMPT = `Extrahera från fakturabilderna (svenska/internationella, inkl Worldline/Bambora, DHL). Returnera BARA giltig JSON:

{
  "invoice_number": string,
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD" | null,
  "total_amount": number,
  "supplier": string,
  "ocr_number": string | null,
  "bankgiro": string | null,
  "plusgiro": string | null,
  "iban": string | null
}

Prioritera grand total ("Belopp att betala" eller "Att betala").`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    let images: string[] = [];

    if (file.type.startsWith('image/')) {
      images.push(`data:${file.type};base64,${buffer.toString('base64')}`);
    } else {
      results.push({ error: 'Ladda upp som bilder/PNG för tillfället' });
      continue;
    }

    if (images.length === 0) {
      results.push({ error: 'Inga bilder' });
      continue;
    }

    let completion;
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-beta',  // Vision-stark + billig
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: VISION_PROMPT },
              ...images.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
            ] as any  // Bypass OpenAI SDK type-klagan för Grok vision
          }
        ],
        temperature: 0,
        max_tokens: 1024,
      });
    } catch (e) {
      results.push({ error: 'Grok API-fel (kolla key/model)', details: String(e) });
      continue;
    }

    let parsed;
    try {
      const content = completion.choices[0].message.content?.trim() || '';
      parsed = JSON.parse(content);
    } catch (e) {
      results.push({ error: 'JSON-fel från Grok', raw: completion.choices[0].message.content });
      continue;
    }

    const fileName = `${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`invoices/${fileName}`, buffer, { upsert: true });

    if (uploadError) {
      results.push({ error: 'Storage-fel', details: uploadError.message });
      continue;
    }

    const publicUrl = supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl;

    const { error: upsertError } = await supabase.from('invoices').upsert({
      invoice_number: parsed.invoice_number || 'Okänd',
      amount: parsed.total_amount,
      due_date: parsed.due_date,
      supplier: parsed.supplier || 'Okänd',
      ocr_number: parsed.ocr_number,
      bankgiro: parsed.bankgiro,
      plusgiro: parsed.plusgiro,
      iban: parsed.iban,
      pdf_url: publicUrl,
      full_parsed_data: parsed,
    });

    if (upsertError) {
      results.push({ error: 'Upsert-fel', details: upsertError.message });
      continue;
    }

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/invoices');

  return Response.json({ results });
}
