'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Trash2, Search, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    setInvoices(data || []);
    setFilteredInvoices(data || []);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredInvoices(
      invoices.filter((inv) =>
        JSON.stringify(Object.values(inv || {})).toLowerCase().includes(lower)
      )
    );
  }, [searchTerm, invoices]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploadStatus('loading');
    setStatusMessage('Bearbetar faktura...');

    const file = acceptedFiles[0];
    const formData = new FormData();
    let filesToSend: File[] = [file];

    if (file.type === 'application/pdf') {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.mjs';

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d')!;
          await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          }).promise;
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
          filesToSend.push(new File([blob], `page-${pageNum}.png`, { type: 'image/png' }));
        }
      } catch (err) {
        setStatusMessage('PDF-konvertering misslyckades – skickar original ändå');
        console.error('PDF render error:', err);
      }
    }

    filesToSend.forEach((f) => formData.append('files', f));

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || 'Upload misslyckades');
      }

      setUploadStatus('success');
      setStatusMessage('Faktura uppladdad och parsad!');
      fetchInvoices();
    } catch (err: any) {
      setUploadStatus('error');
      setStatusMessage(`Fel: ${err.message}`);
    } finally {
      setTimeout(() => {
        setUploadStatus('idle');
        setStatusMessage('');
      }, 8000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxFiles: 1,
  });

  const deleteInvoice = async (id: string, pdf_url?: string) => {
    if (!confirm('Radera fakturan permanent?')) return;

    if (pdf_url) {
      const fileName = pdf_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('invoices').remove([`invoices/${fileName}`]);
      }
    }

    await supabase.from('invoices').delete().eq('id', id);
    fetchInvoices();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-10 text-center">Fakturor</h1>

      <section className="mb-12">
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-2xl p-20 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <p className="text-2xl font-medium">
            {isDragActive ? 'Släpp filen här' : 'Dra och släpp PDF eller bildfaktura här'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Digitala och skannade fakturor stöds</p>

          {uploadStatus === 'loading' && <Loader2 className="w-10 h-10 mx-auto mt-6 animate-spin text-blue-600" />}
          {uploadStatus === 'success' && <CheckCircle className="w-10 h-10 mx-auto mt-6 text-green-600" />}
          {uploadStatus === 'error' && <XCircle className="w-10 h-10 mx-auto mt-6 text-red-600" />}

          {statusMessage && <p className="mt-4 text-lg font-medium">{statusMessage}</p>}
        </div>
      </section>

      <div className="relative mb-10 max-w-md mx-auto">
        <Search className="absolute left-4 top-3.5 w-6 h-6 text-gray-500" />
        <input
          type="text"
          placeholder="Sök i fakturor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredInvoices.length === 0 ? (
        <p className="text-center text-gray-500 text-xl py-20">Inga fakturor hittades.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredInvoices.map((inv) => (
            <div key={inv.id} className="bg-white rounded-xl shadow-lg p-6 relative hover:shadow-xl transition">
              <button
                onClick={() => deleteInvoice(inv.id, inv.pdf_url)}
                className="absolute top-4 right-4 text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-6 h-6" />
              </button>

              <div className="space-y-3 text-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {inv.amount ? `${parseFloat(inv.amount || '0').toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kr` : '—'}
                </p>
                <p>
                  <strong>Förfallodatum:</strong> {inv.due_date || '—'}
                </p>
                <p>
                  <strong>Leverantör:</strong> {inv.supplier || '—'}
                </p>
                <p>
                  <strong>Fakturanr:</strong> {inv.invoice_number || '—'}
                </p>
                <p>
                  <strong>OCR:</strong> {inv.ocr_number || '—'}
                </p>
                <p>
                  <strong>Bankgiro:</strong> {inv.bankgiro || '—'}
                </p>
              </div>

              <div className="mt-8 flex gap-4">
                {inv.pdf_url && (
                  <a
                    href={inv.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Öppna PDF
                  </a>
                )}
                <Link
                  href="/fortusflex"
                  className="flex-1 text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
                >
                  FortusFlex-kalkyl
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
