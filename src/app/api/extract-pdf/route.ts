import { Groq } from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (files.length === 0 || !files[0]) {
      return NextResponse.json({ error: 'Ingen fil uppladdad' }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { // Max 10MB för Groq-vision
        results.push({ error: 'Filen för stor (max 10MB)', file: file.name });
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString('base64');
      const mimeType = file.type || 'application/pdf';
      const imageUrl = `data:${mimeType};base64,${base64}`;

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: [
              { 
                type: 'text', 
                text: 'Extrahera exakt från denna Telavox-faktura som JSON: invoice_number (fakturanummer), due_date (förfallodatum YYYY-MM-DD), total_amount (totalbelopp inkl kr), supplier (leverantör), ocr_number (OCR-nr), bankgiro, och line_items som array med description och amount. Var exakt, ingen förklaring.' 
              },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        model: 'meta-llama/llama-4-scout-17b-16e-instruct', // Ny rekommenderad multimodal modell
        temperature: 0,
        max_tokens: 1024,
      });

      let parsed;
      try {
        parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      } catch (e) {
        parsed = { error: 'JSON-parse misslyckades', raw: completion.choices[0]?.message?.content };
      }

      // Storage upload
      const fileName = `${parsed.invoice_number || Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        parsed.pdf_url = null;
        parsed.upload_error = uploadError.message;
      } else {
        // Signed URL (funkar alltid, expires 1 timme)
        const { data: signedUrlData } = await supabase.storage
          .from('invoices')
          .createSignedUrl(fileName, 60 * 60); // 1 timme

        parsed.pdf_url = signedUrlData?.signedUrl || null;
      }

      // DB upsert
      const { error: dbError } = await supabase.from('invoices').upsert({
        invoice_number: parsed.invoice_number,
        amount: parsed.total_amount,
        due_date_tenant: parsed.due_date,
        supplier: parsed.supplier || 'Telavox AB',
        ocr_number: parsed.ocr_number,
        bankgiro: parsed.bankgiro,
        pdf_url: parsed.pdf_url,
        full_parsed_data: parsed,
      });

      if (dbError) console.error('DB error:', dbError);

      results.push(parsed);
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    console.error('API route error:', err.message, err.stack);
    return NextResponse.json({ error: err.message || 'Serverfel' }, { status: 500 });
  }
}

// Nya exports – inga warnings
export const dynamic = 'force-dynamic';     // Tvingar dynamic rendering (nödvändigt för uploads)
export const runtime = 'nodejs';            // Säkerställer Node.js runtime
export const maxDuration = 60;              // Tillåt upp till 60 sekunder execution (bra för Groq)
