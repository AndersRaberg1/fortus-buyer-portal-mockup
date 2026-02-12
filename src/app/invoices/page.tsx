'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { Trash2, Search, Upload, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker (nödvändig för client-side konvertering)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Fetch error:', error);
    else {
      setInvoices(data || []);
      setFilteredInvoices(data || []);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredInvoices(
      invoices.filter(inv =>
        Object.values(inv || {}).some(value =>
          value?.toString().toLowerCase().includes(lower)
        )
      )
    );
  }, [searchTerm, invoices]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setUploadStatus('loading');
    setStatusMessage('Bearbetar...');

    const file = acceptedFiles[0];
    const formData = new FormData();
    let filesToSend: File[] = [];

    if (file.type === 'application/pdf') {
      // Konvertera PDF till PNG-bilder (för skannade) + lägg till original PDF
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('pdf' as any);
          await page.render({ canvasContext: context, viewport }).promise;
          const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
          filesToSend.push(new File([blob], `page-${pageNum}.png`, { type: 'image/png' }));
        }
        // Lägg till original PDF sist (backend sparar den)
        filesToSend.push(file);
      } catch (err) {
        setStatusMessage('PDF-konvertering misslyckades');
        setUploadStatus('error');
        setLoading(false);
        return;
      }
    } else if (file.type.startsWith('image/')) {
      filesToSend = [file];
    } else {
      setStatusMessage('Ogiltig fil');
      setLoading(false);
      return;
    }

    // Lägg till alla som 'files' (plural)
    filesToSend.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok || result.results?.some((r: any) => r.error)) {
        const err = result.results?.find((r: any) => r.error)?.error || 'Misslyckades';
        throw new Error(err);
      }

      setUploadStatus('success');
      setStatusMessage('Faktura parsad och sparad!');
      await fetchInvoices();
    } catch (err: any) {
      setUploadStatus('error');
      setStatusMessage(`Fel: ${err.message}`);
      console.error('Upload fel:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setUploadStatus('idle'), 5000);
    }
  };

  const deleteInvoice = async (inv: any) => {
    if (!confirm('Radera fakturan permanent?')) return;

    if (inv.pdf_url) {
      const fileName = inv.pdf_url.split('/').pop();
      await supabase.storage.from('invoices').remove([`invoices/${fileName}`]);
    }

    const { error } = await supabase.from('invoices').delete().eq('id', inv.id);
    if (error) console.error('Delete error:', error);
    else await fetchInvoices();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Fakturor</h1>

      <section className="mb-12">
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-xl p-16 text-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl">{isDragActive ? 'Släpp filen' : 'Dra och släpp PDF eller bildfaktura'}</p>
          <p className="text-sm text-gray-600 mt-2">Digitala eller skannade PDF stöds</p>
          {loading && <Loader2 className="w-8 h-8 mx-auto mt-4 animate-spin" />}
          {uploadStatus === 'success' && <CheckCircle className="w-8 h-8 mx-auto mt-4 text-green-600" />}
          {uploadStatus === 'error' && <AlertCircle className="w-8 h-8 mx-auto mt-4 text-red-600" />}
          {statusMessage && <p className="mt-4 text-lg">{statusMessage}</p>}
        </div>
      </section>

      {/* Sök + lista – oförändrad */}
      <section>
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3 w-6 h-6 text-gray-500" />
          <input
            type="text"
            placeholder="Sök fakturor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredInvoices.length === 0 ? (
          <p className="text-center text-gray-500 py-16">Inga fakturor hittades.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-lg shadow-lg p-6 relative">
                <button onClick={() => deleteInvoice(inv)} className="absolute top-4 right-4 text-red-600">
                  <Trash2 className="w-6 h-6" />
                </button>
                <div className="space-y-3 text-lg">
                  <p className="text-3xl font-bold text-blue-600">{inv.amount || 'Ej hittat'}</p>
                  <p><strong>Förfallodatum:</strong> {inv.due_date || 'Ej hittat'}</p>
                  <p><strong>Leverantör:</strong> {inv.supplier || 'Ej hittat'}</p>
                  <p><strong>Fakturanummer:</strong> {inv.invoice_number || 'Ej hittat'}</p>
                  <p><strong>OCR:</strong> {inv.ocr_number || 'Ej hittat'}</p>
                  <p><strong>Bankgiro:</strong> {inv.bankgiro || 'Ej hittat'}</p>
                </div>
                <div className="mt-6 flex gap-4">
                  <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg">
                    Öppna PDF
                  </a>
                  <Link href="/fortusflex" className="flex-1 text-center bg-green-600 text-white py-3 rounded-lg">
                    FortusFlex-kalkyl
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
