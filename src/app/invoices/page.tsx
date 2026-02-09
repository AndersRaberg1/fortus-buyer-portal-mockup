"use client";

import { useDropzone } from 'react-dropzone';
import { useState } from 'react';

export default function Invoices() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<any>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    setLoading(true);
    setError(null);
    setParsed(null);

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setParsed(data.parsed);
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

        {parsed && (
          <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
            <h3 className="font-bold mb-4">Extraherad data</h3>
            <p><strong>Belopp:</strong> {parsed.amount}</p>
            <p><strong>Förfallodatum:</strong> {parsed.dueDate}</p>
            <p><strong>Leverantör:</strong> {parsed.supplier}</p>
            <p><strong>Fakturanummer:</strong> {parsed.invoiceNumber}</p>
            <p><strong>OCR-nummer:</strong> {parsed.ocrNumber}</p>
            <button className="mt-6 w-full bg-primary text-white py-3 rounded-lg">Godkänn & finansiera</button>
          </div>
        )}
      </div>

      {/* Här kan du lägga till lista med tidigare fakturor senare */}
    </div>
  );
}