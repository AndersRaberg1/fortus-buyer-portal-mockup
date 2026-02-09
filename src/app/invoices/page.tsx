'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestParsed, setLatestParsed] = useState<any>(null);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setInvoices(data || []);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setLoading(true);
    setError(null);
    setLatestParsed(null);

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Upload misslyckades');
      }

      setLatestParsed(result.parsed);
      await fetchInvoices(); // Uppdatera lista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': [], 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <h1 className="text-3xl font-bold mb-8">Fakturor & ordrar</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Ladda upp ny faktura</h2>
        <div
          {...getRootProps()}
          className={`border-4 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <p className="text-xl">
            {isDragActive ? 'Släpp filen här' : 'Dra och släpp PDF/bild eller klicka'}
          </p>
          {loading && <p className="mt-4 text-blue-600">Bearbetar...</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>
      </section>

      {/* Visa senaste uppladdade direkt */}
      {latestParsed && (
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Nyuppladdad faktura (bearbetad)</h2>
          <div className="bg-green-50 dark:bg-green-900 rounded-xl shadow p-6">
            <p><strong>Belopp:</strong> {latestParsed.amount}</p>
            <p><strong>Förfallodatum:</strong> {latestParsed.dueDate}</p>
            <p><strong>Leverantör:</strong> {latestParsed.supplier}</p>
            <p><strong>Fakturanummer:</strong> {latestParsed.invoiceNumber}</p>
            <p><strong>OCR-nummer:</strong> {latestParsed.ocrNumber}</p>
            <p><strong>Bankgiro:</strong> {latestParsed.bankgiro}</p>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-2xl font-semibold mb-4">Sparade fakturor</h2>
        {invoices.length === 0 ? (
          <p>Inga fakturor sparade än.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((inv) => (
              <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <p><strong>Belopp:</strong> {inv.amount || 'Ej hittat'}</p>
                <p><strong>Förfallodatum:</strong> {inv.due_date || 'Ej hittat'}</p>
                <p><strong>Leverantör:</strong> {inv.supplier || 'Ej hittat'}</p>
                <p><strong>Fakturanummer:</strong> {inv.invoice_number || 'Ej hittat'}</p>
                <p><strong>OCR-nummer:</strong> {inv.ocr_number || 'Ej hittat'}</p>
                <p><strong>Bankgiro:</strong> {inv.bankgiro || 'Ej hittat'}</p>
                <a
                  href={inv.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-blue-600 hover:underline"
                >
                  Öppna PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}