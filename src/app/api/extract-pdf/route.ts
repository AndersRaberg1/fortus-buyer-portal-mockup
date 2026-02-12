import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import pdfParse from 'pdf-parse'; // För text-extraction från printable PDF

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const SYSTEM_PROMPT = `Du är en expert på svenska och internationella fakturor.
Svara ENDAST med giltig JSON enligt detta exakta schema. Inget annat.
{
  "invoice_number": string,
  "invoice_date": "YYYY-MM-DD" | null,
  "due_date": "YYYY-MM-DD" | null,
  "total_amount": number,
  "supplier": string,
  "ocr_number": string | null,
  "bankgiro": string | null,
  "plusgiro": string | null,
  "iban": string | null
}
Prioritera grand total ("Att betala"). Var extremt noggrann.`;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  const results = [];

  let originalPdfBuffer: Buffer | null = null;
  let originalFileName: string | null = null;
  let imageBase64s: string[] = [];
  let textContent = '';

  // Samla filer
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (file.type === 'application/pdf') {
      originalPdfBuffer = buffer;
      originalFileName = file.name;
      // Försök text-extraction
      try {
        const pdf = await pdfParse(buffer);
        textContent = pdfData.text.trim();
      } catch (e) {
        console.log('Text-extraction misslyckades – fallback till vision');
      }
    } else if (file.type.startsWith('image/')) {
      imageBase64s.push(`data:${file.type};base64,${buffer.toString('base64')}`);
    }
  }

  for (let i = 0; i < files.length; i++) { // En result per huvudfil
    let parsed: any = {};

    try {
      let completion;
      if (textContent.length > 500) {
        // Text-baserad parsing (digital PDF)
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
        // Vision-baserad (skannad/multi-page)
        completion = await grok.chat.completions.create({
          model: 'grok-4',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            {
              role: 'user',
              content: [
                { type: 'text', text: `Extrahera från ${imageBase64s.length} sidor:` },
                ...imageBase64s.map(img => ({ type: 'image_url', image_url: { url: img } }))
              ],
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0,
        });
      } else {
        throw new Error('Ingen läsbar data – ladda upp bild eller digital PDF');
      }

      const raw = completion.choices[0].message.content?.trim() || '{}';
      parsed = JSON.parse(raw);
    } catch (e: any) {
      results.push({ error: 'Grok-fel: ' + (e.message || String(e)) });
      continue;
    }

    // Spara original PDF/bild
    let publicUrl = '';
    if (originalPdfBuffer && originalFileName) {
      const fileName = `${Date.now()}-${originalFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`invoices/${fileName}`, originalPdfBuffer, { upsert: true, contentType: 'application/pdf' });

      if (uploadError) {
        results.push({ error: 'Storage-fel', details: uploadError.message });
        continue;
      }
      publicUrl = supabase.storage.from('invoices').getPublicUrl(uploadData.path).data.publicUrl;
    }

    // Spara till DB
    const { error: upsertError } = await supabase.from('invoices').upsert({
      invoice_number: parsed?.invoice_number || 'Okänd',
      amount: Number(parsed?.total_amount) ?? 0,
      due_date: parsed?.due_date || null,
      supplier: parsed?.supplier || 'Okänd',
      ocr_number: parsed?.ocr_number || null,
      bankgiro: parsed?.bankgiro || null,
      plusgiro: parsed?.plusgiro || null,
      iban: parsed?.iban || null,
      pdf_url: publicUrl,
      full_parsed_data: parsed,
    });

    if (upsertError) {
      results.push({ error: 'DB-fel', details: upsertError.message });
      continue;
    }

    results.push({ success: true, parsed, publicUrl });
  }

  revalidatePath('/');
  revalidatePath('/invoices');

  return Response.json({ results });
}
