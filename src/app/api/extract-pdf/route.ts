import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { getDocument } from 'pdfjs-dist';

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

async function pdfToBase64Images(buffer: Buffer): Promise<string[]> {
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const images: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const context = canvas.getContext('2d')!;
    await page.render({ canvasContext: context, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }

  return images;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  const results = [];

  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());

    let images: string[] = [];

    if (file.type.startsWith('image/')) {
      images.push(`data:${file.type};base64,${buffer.toString('base64')}`);
    } else if (file.type === 'application/pdf') {
      try {
        images = await pdfToBase64Images(buffer);  // Konverterar PDF till bilder
      } catch (e) {
        results.push({ error: 'PDF-konverteringsfel', details: String(e) });
        continue;
      }
    } else {
      results.push({ error: 'Ogiltigt format – använd PNG/JPEG/PDF' });
      continue;
    }

    if (images.length === 0) {
      results.push({ error: 'Inga sidor/bilder hittades' });
      continue;
    }

    let completion;
    try {
      completion = await grok.chat.completions.create({
        model: 'grok-2-vision-1212',  // Rätt vision-modell feb 2026 – läser bilder/PDF perfekt
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
      const content = completion.choices[0].message.content?.trim() || '';
      parsed = JSON.parse(content);
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
