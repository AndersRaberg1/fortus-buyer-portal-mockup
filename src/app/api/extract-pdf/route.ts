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
      results.push({ error: 'Ladda upp som bilder för tillfället' });
      continue;
    }

    if (images.length === 0) {
      results.push({ error: 'Inga bilder' });
      continue;
    }

    let completion;
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-4',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extrahera all nyckeldata från fakturabilderna.' },
              ...images.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
            ] as any
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 2048,
      });
      console.log('GROK ANROP LYCKADES');
    } catch (e: any) {
      console.error('GROK API-FEL:', e);  // Det här syns i Vercel logs
      console.error('FEL DETAILS:', e.message || String(e));
      results.push({ error: 'Grok API-fel – kolla Vercel logs för details', details: e.message || String(e) });
      continue;
    }

    // Resten oförändrad (parse, upload, upsert – lägg till console.log där om du vill)
    // ...

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/');
  revalidatePath('/invoices');

  return Response.json({ results });
}
