"use client";

import { useDropzone } from 'react-dropzone';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Invoices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Supabase fetch error:', error);
    else setInvoices(data || []);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      fetchInvoices(); // Uppdatera lista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20 md:pb-6">
      <h2 className="text-2xl font-bold mb-6">Fakturor & ordrar</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 mb-8">
        <p className="font-medium mb-6">Ladda upp ny faktura</p>
        <div className="border-2 border-dashed rounded-xl p-12 text-center" {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? <p>Släpp här...</p> : <p>Dra och släpp PDF/bild eller klicka</p>}
        </div>

        {loading && <p className="text-center text-primary mt-6">Bearbetar med OCR...</p>}
        {error && <p className="text-red-600 text-center mt-6">{error}</p>}

        {result && (
          <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
            <h3 className="font-bold mb-4">Extraherad data</h3>
            <p><strong>Belopp:</strong> {result.parsed.amount}</p>
            <p><strong>Förfallodatum:</strong> {result.parsed.dueDate}</p>
            <p><strong>Leverantör:</strong> {result.parsed.supplier}</p>
            <p><strong>Fakturanummer:</strong> {result.parsed.invoiceNumber}</p>
            <p><strong>OCR-nummer:</strong> {result.parsed.ocrNumber}</p>
            <p className="mt-4 text-green-600 font-medium">{result.message}</p>
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold mb-6">Sparade fakturor</h3>
      {invoices.length === 0 ? (
        <p className="text-gray-500">Inga fakturor sparade än.</p>
      ) : (
        <div className="space-y-6">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <p><strong>Belopp:</strong> {inv.parsed_data.amount}</p>
              <p><strong>Förfallodatum:</strong> {inv.parsed_data.dueDate}</p>
              <p><strong>Leverantör:</strong> {inv.parsed_data.supplier}</p>
              <p><strong>Fakturanummer:</strong> {inv.parsed_data.invoiceNumber}</p>
              <p><strong>OCR-nummer:</strong> {inv.parsed_data.ocrNumber}</p>
              <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block bg-primary text-white px-4 py-2 rounded-lg">
                Öppna PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}