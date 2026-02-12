'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@supabase/supabase-js';
import * as pdfjsLib from 'pdfjs-dist';

// Worker för client-side PDF-konvertering
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setFilteredInvoices(data || []);
  };

  useEffect(() => { fetchInvoices(); }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    setFilteredInvoices(invoices.filter(inv => JSON.stringify(inv).toLowerCase().includes(lower)));
  }, [searchTerm, invoices]);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploadStatus('loading');
    setStatusMessage('Bearbetar PDF...');

    const file = acceptedFiles[0];
    const formData = new FormData();
    let filesToSend: File[] = [file]; // Alltid skicka original

    if (file.type === 'application/pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d')!; // FIX: '2d' istället för 'pdf'
          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext).promise;
          const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png'));
          filesToSend.push(new File([blob], `page-${pageNum}.png`, { type: 'image/png' }));
        }
      } catch (err) {
        setStatusMessage('PDF-konvertering misslyckades – försöker ändå');
      }
    }

    filesToSend.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: formData });
      const result = await res.json();

      if (!res.ok || result.error) throw new Error(result.error || 'Misslyckades');

      setUploadStatus('success');
      setStatusMessage('Faktura parsad och sparad!');
      fetchInvoices();
    } catch (err: any) {
      setUploadStatus('error');
      setStatusMessage(`Fel: ${err.message}`);
    } finally {
      setTimeout(() => { setUploadStatus('idle'); setStatusMessage(''); }, 8000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': [] },
    maxFiles: 1,
  });

  // ... resten av JSX (dropzone, sök, lista) – behåll din befintliga
  // Lägg till status-indikatorer i dropzone som i tidigare exempel

  return (
    // Din JSX här – samma som tidigare, lägg till statusMessage etc.
    <div>...</div>
  );
}
