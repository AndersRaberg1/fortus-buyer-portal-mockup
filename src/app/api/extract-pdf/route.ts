import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const SYSTEM_PROMPT = `Du är en expert på svenska och internationella fakturor (DHL, Worldline/Bambora m.fl.).
Svara ENDAST med giltig JSON enligt detta exakta schema. Inget annat – ingen förklaring, ingen markdown, ingen extra text.
Schema:
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
Prioritera grand total ("Att betala" / "Belopp att betala"). Var extremt noggrann med svenska fakturor.`;

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
      results.push({ error: 'Ladda upp som bilder (PNG/JPEG) för tillfället' });
      continue;
    }

    if (images.length === 0) {
      results.push({ error: 'Inga bilder' });
      continue;
    }

    let completion;
    let parsed = {};  // Deklareras här för att undvika shorthand-fel
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahera all nyckeldata från fakturabilderna (flera sidor om det finns).' },
              ...images.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
            ] as any
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 2048,
      });
      console.log('GROK ANROP LYCKADES');

      const raw = completion.choices[0].message.content?.trim() || '';
      parsed = JSON.parse(raw);
      console.log('PARSED OK:', parsed);
    } catch (e: any) {
      console.error('GROK API-FEL:', e.message || String(e));
      results.push({ error: 'Grok API-fel – kolla Vercel logs', details: e.message || String(e) });
      continue;
    }

    const fileName = `${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`invoices/${fileName}`, buffer, { upsert: true });

    if (uploadError) {
      console.error('STORAGE-FEL:', uploadError.message);
      results.push({ error: 'Storage-fel', details: uploadError.message });
      continue;
    }

    const publicUrl = supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl;

    const { error: upsertError } = await supabase.from('invoices').upsert({
      invoice_number: parsed.invoice_number || 'Okänd',
      amount: Number(parsed.total_amount) ?? 0,
      due_date: parsed.due_date || null,
      supplier: parsed.supplier || 'Okänd',
      ocr_number: parsed.ocr_number || null,
      bankgiro: parsed.bankgiro || null,
      plusgiro: parsed.plusgiro || null,
      iban: parsed.iban || null,
      pdf_url: publicUrl,
      full_parsed_data: parsed,
    });

    if (upsertError) {
      console.error('UPSERT-FEL:', upsertError.message);
      results.push({ error: 'Upsert-fel i Supabase', details: upsertError.message });
      continue;
    }

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/');
  revalidatePath('/invoices');

  return Response.json({ results });
}
