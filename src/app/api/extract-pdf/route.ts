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

const USER_PROMPT = "Extrahera all nyckeldata från fakturabilderna.";

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
      results.push({ error: 'Ladda upp som bilder/PNG för tillfället (PDF-support kommer)' });
      continue;
    }

    if (images.length === 0) {
      results.push({ error: 'Inga bilder' });
      continue;
    }

    let completion;
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-4-1-fast-reasoning',  // Senaste vision-modellen feb 2026 – full bildsupport + reasoning
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: USER_PROMPT },
              ...images.map(img => ({ type: 'image_url' as const, image_url: { url: img } }))
            ] as any
          }
        ],
        response_format: { type: "json_object" },  // TVINGAR ren JSON – löser parse-problem
        temperature: 0,
        max_tokens: 2048,
      });

      // FELLLOGGNING: Skriver ut rå Grok-respons i terminalen (dev-server)
      const rawContent = completion.choices[0].message.content?.trim() || '';
      console.log('=== GROK RAW RESPONSE ===');
      console.log(rawContent);
      console.log('=== SLUT GROK RESPONSE ===');

    } catch (e: any) {
      console.error('Grok API-fel:', e);  // FELLLOGGNING i terminal
      results.push({ 
        error: 'Grok API-fel – kolla nyckel/quota/modell', 
        details: e.message || String(e) 
      });
      continue;
    }

    let parsed;
    try {
      const content = completion.choices[0].message.content?.trim() || '';
      if (!content) throw new Error('Tom respons från Grok');
      parsed = JSON.parse(content);
    } catch (e: any) {
      console.error('JSON-parse fel från Grok – rå content:', completion.choices[0].message.content);  // FELLLOGGNING
      results.push({ 
        error: 'JSON-fel från Grok – kunde inte parsa', 
        raw_content: completion.choices[0].message.content  // Syns i frontend/network för debug
      });
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
      console.error('Supabase upsert-fel:', upsertError);  // FELLLOGGNING
      results.push({ error: 'Upsert-fel', details: upsertError.message });
      continue;
    }

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/');
  revalidatePath('/invoices');

  return Response.json({ results });
}
