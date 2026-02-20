'use client';

import React from 'react';

type ContactRow = {
  name: string;
  handle: string;
  platform: string;
  category: string;
  status: string;
  lastContactDate: string;
  notes: string;
  tags: string;
};

const COLUMNS: Array<keyof ContactRow> = [
  'name',
  'handle',
  'platform',
  'category',
  'status',
  'lastContactDate',
  'notes',
  'tags',
];

const STARTER_ROWS: ContactRow[] = [
  {
    name: 'Example Creator',
    handle: '@examplecreator',
    platform: 'X',
    category: 'Fantasy Sports',
    status: 'To Outreach',
    lastContactDate: '',
    notes: 'High engagement with fantasy audience',
    tags: 'influencer,dfs,launch',
  },
  {
    name: 'Example Community Lead',
    handle: 'discord.gg/example',
    platform: 'Discord',
    category: 'Community',
    status: 'Contacted',
    lastContactDate: '',
    notes: 'Follow up with partnership deck',
    tags: 'community,partner',
  },
];

function toCsv(rows: ContactRow[]) {
  const header = COLUMNS.join(',');
  const lines = rows.map((row) =>
    COLUMNS.map((col) => {
      const val = String(row[col] ?? '');
      const escaped = val.replaceAll('"', '""');
      return `"${escaped}"`;
    }).join(',')
  );
  return [header, ...lines].join('\n');
}

export default function MarketingContactsTemplatePage() {
  const handleDownloadCsv = () => {
    const csv = toCsv(STARTER_ROWS);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sbs-marketing-contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white px-4 py-8 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-black">Marketing Contact Database Template</h1>
          <p className="text-white/60 mt-2 text-sm">
            Backlog #79 helper: download a Google-Sheets-ready CSV template for marketing outreach tracking.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-lg bg-yellow-400 text-black font-semibold hover:bg-yellow-300 transition-colors"
          >
            Download CSV Template
          </button>
          <p className="text-xs text-white/50 mt-2">
            Import into Google Sheets: File → Import → Upload → Replace/Append.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-white/70 border-b border-white/10">
                {COLUMNS.map((col) => (
                  <th key={col} className="py-2 pr-4 font-semibold">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STARTER_ROWS.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-b-0">
                  {COLUMNS.map((col) => (
                    <td key={col} className="py-2 pr-4 text-white/85">{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
