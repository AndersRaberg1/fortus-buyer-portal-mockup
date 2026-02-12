import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SYSTEM_PROMPT = `Du är expert på svenska fakturor. Extrahera exakt från texten. Svara ENDAST giltig JSON.

Fält:
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
}

Regler:
- total_amount: "Total SEK", "Total att betala", "Att betala" eller "Totalbelopp" (inkl moms)
- due_date: "Final payment date", "Förfallodatum" eller "Att betala senast"
- bankgiro: Sök efter "Bankgiro" eller "Bg"
- ocr_number: Sök efter "OCR" eller "Referensnr"
- supplier: Företag högst upp
- invoice_date: "Date of invoice" eller "Fakturadatum"`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) return NextResponse.json({ error: 'Inga filer' }, { status: 400 });

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());

    let text = '';
    if (file.type === 'application/pdf') {
      const data = await pdfParse(buffer);
      text = data.text;
    } else {
      return NextResponse.json({ error: 'Endast PDF stöds' }, { status: 400 });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || '{}');

    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`invoices/${fileName}`, buffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const publicUrl = supabase.storage.from('invoices').getPublicUrl(`invoices/${fileName}`).data.publicUrl;

    const { error: dbError } = await supabase.from('invoices').upsert({
      ...parsed,
      amount: parsed.total_amount ?? null,
      pdf_url: publicUrl,
    });

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, data: parsed, pdf_url: publicUrl });
  } catch (error: any) {
    console.error('Fel:', error);
    return NextResponse.json({ error: error.message || 'Serverfel' }, { status: 500 });
  }
}
