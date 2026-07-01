'use client';

import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileType,
  Eye,
} from 'lucide-react';
import { toast } from 'react-toastify';

import SellerButton from '@/components/seller/SellerButton';
import SellerSectionHeader from '@/components/seller/SellerSectionHeader';
import SellerSelect from '@/components/seller/SellerSelect';
import StatCard from '@/components/seller/StatCard';
import {
  SellerTable,
  SellerTableBody,
  SellerTableCell,
  SellerTableHeader,
  SellerTableRow,
} from '@/components/seller/SellerTable';

interface PreviewRow {
  [key: string]: string;
}

export default function ImportExportPage(): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState('products');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string) => {
    setExporting(type);
    try {
      const res = await fetch('/api/admin/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Erreur export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Export ${type} terminé.`);
    } catch {
      toast.error('Erreur lors de l\'export.');
    } finally {
      setExporting(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        setPreviewRows([]);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim());
      const rows = lines.slice(1, 4).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: PreviewRow = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        return row;
      });
      setPreviewRows(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Veuillez sélectionner un fichier.');
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('type', importType);
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Erreur import');
      const result = await res.json();
      toast.success(`Import terminé : ${result.count || 'OK'}`);
      setImportFile(null);
      setPreviewRows([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Erreur lors de l\'import.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-8">
      <SellerSectionHeader title="Import / Export" />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard title="Export" value="CSV" description="Télécharger les données" icon={Download} accentColor="blue" />
        <StatCard title="Import" value="CSV" description="Importer des données" icon={Upload} accentColor="green" />
      </div>

      {/* Export */}
      <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <Download className="h-5 w-5 text-[var(--accent-blue)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Export</h2>
        </div>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Téléchargez les données de votre boutique au format CSV.
        </p>
        <div className="flex flex-wrap gap-3">
          <SellerButton
            icon={FileSpreadsheet}
            disabled={exporting === 'products'}
            onClick={() => handleExport('products')}
          >
            {exporting === 'products' ? 'Export...' : 'Produits (CSV)'}
          </SellerButton>
          <SellerButton
            icon={FileSpreadsheet}
            disabled={exporting === 'orders'}
            onClick={() => handleExport('orders')}
          >
            {exporting === 'orders' ? 'Export...' : 'Commandes (CSV)'}
          </SellerButton>
          <SellerButton
            icon={FileSpreadsheet}
            disabled={exporting === 'users'}
            onClick={() => handleExport('users')}
          >
            {exporting === 'users' ? 'Export...' : 'Utilisateurs (CSV)'}
          </SellerButton>
        </div>
      </div>

      {/* Import */}
      <div className="rounded-[10px] bg-[var(--bg-outer)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <Upload className="h-5 w-5 text-[var(--accent-green)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Import</h2>
        </div>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Importez des données depuis un fichier CSV.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="min-w-[160px]">
            <SellerSelect
              value={importType}
              onChange={setImportType}
              options={[
                { value: 'products', label: 'Produits' },
                { value: 'orders', label: 'Commandes' },
                { value: 'users', label: 'Utilisateurs' },
              ]}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            <FileType className="h-4 w-4" />
            {importFile ? importFile.name : 'Choisir un fichier CSV'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {importFile && (
            <SellerButton
              icon={Upload}
              disabled={importing}
              onClick={handleImport}
            >
              {importing ? 'Import...' : 'Importer'}
            </SellerButton>
          )}
        </div>

        {previewRows.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-[var(--accent-blue)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Aperçu ({previewRows.length} premières lignes)
              </span>
            </div>
            <SellerTable className="!border-0 !bg-transparent [&_thead]:!border-y-0 [&_thead]:!bg-transparent [&_tbody]:!divide-y-0 [&_tr]:!hover:bg-transparent">
              <SellerTableHeader>
                <SellerTableRow>
                  {Object.keys(previewRows[0]).map((header) => (
                    <SellerTableCell key={header} isHeader>
                      {header}
                    </SellerTableCell>
                  ))}
                </SellerTableRow>
              </SellerTableHeader>
              <SellerTableBody>
                {previewRows.map((row, idx) => (
                  <SellerTableRow key={idx}>
                    {Object.values(row).map((val, cellIdx) => (
                      <SellerTableCell key={cellIdx} className="text-[var(--text-secondary)]">
                        {val}
                      </SellerTableCell>
                    ))}
                  </SellerTableRow>
                ))}
              </SellerTableBody>
            </SellerTable>
          </div>
        )}
      </div>
    </div>
  );
}
