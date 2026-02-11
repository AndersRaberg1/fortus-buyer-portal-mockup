import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const VISION_PROMPT = `Extrahera från fakturabilderna (svenska/internationella format). Returnera BARA giltig JSON, ingen annan text:

{
  "invoice_number": string,
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD" | null,
  "total_amount": number (prioritera "Belopp att betala" eller grand total),
  "supplier": string,
  "ocr_number": string | null,
  "bankgiro": string | null,
  "plusgiro": string | null,
  "iban": string | null
}

Hantera aggreggade fakturor med många line items (t.ex. Terminal fee).`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    let images: string[] = [];

    // Hantera bilder direkt (JPEG/PNG – ladda upp sidorna som separata bilder)
    if (file.type.startsWith('image/')) {
      images.push(`data:${file.type};base64,${buffer.toString('base64')}`);
    } else {
      // För PDF: Ladda upp som separata bilder tills vi lägger till client-side conversion
      results.push({ error: 'Ladda upp fakturasidor som bilder (JPEG/PNG) för bästa resultat' });
      continue;
    }

    // Grok vision-call (skickar alla bilder)
    const completion = await grok.chat.completions.create({
      model: 'grok-4',  // Aktuell vision-model (stödjer bilder perfekt)
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: VISION_PROMPT },
            ...images.map(img => ({ type: 'image_url', image_url: { url: img } }))
          ]
        }
      ],
      temperature: 0,
      max_tokens: 1024,
    });

    let parsed;
    try {
      const content = completion.choices[0].message.content?.trim() || '';
      parsed = JSON.parse(content);
    } catch (e) {
      results.push({ error: 'JSON parse fel från Grok' });
      continue;
    }

    // Upload till Storage + upsert (anpassat efter din tabell)
    const fileName = `${Date.now()}-${file.name}`;
    const { data: { publicUrl } } = await supabase.storage.from('invoices').upload(`invoices/${fileName}`, buffer, { upsert: true });

    await supabase.from('invoices').upsert({
      invoice_number: parsed.invoice_number || 'Okänd',
      amount: parsed.total_amount,
      due_date: parsed.due_date,
      supplier: parsed.supplier || 'Worldline/Bambora',
      ocr_number: parsed.ocr_number,
      bankgiro: parsed.bankgiro,
      plusgiro: parsed.plusgiro,
      iban: parsed.iban,
      pdf_url: publicUrl,  // Eller image_url om du vill
      full_parsed_data: parsed,
    });

    results.push({ success: true, parsed });
  }

  return Response.json({ results });
}
