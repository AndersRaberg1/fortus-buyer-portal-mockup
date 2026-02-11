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

    let content: any[] = [];

    if (file.type.startsWith('image/')) {
      // Bilder → vision
      const base64 = buffer.toString('base64');
      content = [
        { type: 'text', text: 'Extrahera all nyckeldata från fakturabilderna.' },
        { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } }
      ];
    } else if (file.type === 'application/pdf') {
      // PDF → text-extraktion (dynamisk import fixar build-felet)
      let pdfData;
      try {
        const pdfParseLib = await import('pdf-parse');
        pdfData = await pdfParseLib.default(buffer);
      } catch (e: any) {
        results.push({ error: 'PDF-parse fel (dynamisk import)', details: e.message || String(e) });
        continue;
      }

      const extractedText = pdfData.text;
      if (extractedText.trim().length < 100) {
        results.push({ error: 'PDF verkar skannad (låg text) – ladda upp som bilder istället.' });
        continue;
      }

      content = [
        { type: 'text', text: `Extrahera all nyckeldata från denna fakturatext:\n\n${extractedText}` }
      ];
    } else {
      results.push({ error: 'Ogiltigt format – använd PNG/JPEG/PDF' });
      continue;
    }

    let completion;
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-4-1-fast-reasoning',  // Senaste vision-modellen feb 2026 – full bild/text-support
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content }
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 2048,
      });
    } catch (e: any) {
      results.push({ error: 'Grok API-fel', details: e.message || String(e) });
      continue;
    }

    let parsed;
    try {
      const raw = completion.choices[0].message.content?.trim() || '';
      if (!raw) throw new Error('Tom respons');
      parsed = JSON.parse(raw);
    } catch (e) {
      results.push({ error: 'JSON-fel från Grok', raw_content: completion.choices[0].message.content });
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
      results.push({ error: 'Upsert-fel i Supabase', details: upsertError.message });
      continue;
    }

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/');
  revalidatePath('/invoices');

  return Response.json({ results });
}
