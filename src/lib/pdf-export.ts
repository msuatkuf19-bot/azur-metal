/**
 * PDF Export Utility
 * Browser-based print-to-PDF with styled HTML
 */

export interface PdfSection {
  title?: string;
  type: 'info-grid' | 'table' | 'summary-cards' | 'text' | 'divider' | 'heading';
  data?: any;
}

export interface PdfExportOptions {
  title: string;
  subtitle?: string;
  date?: string;
  companyName?: string;
  sections: PdfSection[];
  orientation?: 'portrait' | 'landscape';
}

function formatCurrencyPdf(amount: number): string {
  return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}

function generateStyles(orientation: string): string {
  return `
    <style>
      @page {
        size: A4 ${orientation};
        margin: 15mm;
      }
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 11px;
        color: #1f2937;
        line-height: 1.5;
        background: white;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 12px;
        margin-bottom: 20px;
      }
      .header-left h1 {
        font-size: 20px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 2px;
      }
      .header-left .subtitle {
        font-size: 13px;
        color: #6b7280;
      }
      .header-right {
        text-align: right;
        font-size: 10px;
        color: #6b7280;
      }
      .header-right .company {
        font-size: 14px;
        font-weight: 700;
        color: #1e40af;
        margin-bottom: 2px;
      }
      .section {
        margin-bottom: 18px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 14px;
        font-weight: 700;
        color: #1e40af;
        border-bottom: 1px solid #dbeafe;
        padding-bottom: 4px;
        margin-bottom: 10px;
      }
      .heading {
        font-size: 16px;
        font-weight: 700;
        color: #111827;
        margin: 20px 0 10px 0;
        page-break-after: avoid;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 24px;
      }
      .info-item {
        display: flex;
        flex-direction: column;
      }
      .info-label {
        font-size: 9px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .info-value {
        font-size: 11px;
        color: #111827;
        font-weight: 500;
      }
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 8px;
        margin-bottom: 12px;
      }
      .summary-card {
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 10px;
        text-align: center;
        background: #f9fafb;
      }
      .summary-card .label {
        font-size: 9px;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
      }
      .summary-card .value {
        font-size: 15px;
        font-weight: 700;
        margin-top: 2px;
      }
      .summary-card .sub {
        font-size: 9px;
        color: #9ca3af;
        margin-top: 2px;
      }
      .positive { color: #059669; }
      .negative { color: #dc2626; }
      .neutral { color: #111827; }
      .blue { color: #2563eb; }
      .orange { color: #ea580c; }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10px;
        margin-top: 6px;
      }
      thead th {
        background: #f3f4f6;
        padding: 6px 8px;
        text-align: left;
        font-weight: 600;
        font-size: 9px;
        color: #374151;
        text-transform: uppercase;
        border-bottom: 2px solid #d1d5db;
      }
      thead th.right {
        text-align: right;
      }
      tbody td {
        padding: 5px 8px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }
      tbody td.right {
        text-align: right;
      }
      tbody td.bold {
        font-weight: 600;
      }
      tbody tr:nth-child(even) {
        background: #f9fafb;
      }
      tfoot td {
        padding: 6px 8px;
        font-weight: 700;
        border-top: 2px solid #374151;
        background: #f3f4f6;
      }
      tfoot td.right {
        text-align: right;
      }
      .text-content {
        padding: 8px 0;
        white-space: pre-line;
      }
      .divider {
        border-top: 1px dashed #d1d5db;
        margin: 16px 0;
      }
      .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 8px;
        color: #9ca3af;
        padding: 8px 15mm;
        border-top: 1px solid #e5e7eb;
      }
      .badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
      }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-green { background: #dcfce7; color: #166534; }
      .badge-red { background: #fef2f2; color: #991b1b; }
      .badge-yellow { background: #fef9c3; color: #854d0e; }
      .badge-gray { background: #f3f4f6; color: #374151; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  `;
}

function renderSection(section: PdfSection): string {
  switch (section.type) {
    case 'heading':
      return `<div class="heading">${section.title || ''}</div>`;

    case 'divider':
      return '<div class="divider"></div>';

    case 'text':
      return `
        <div class="section">
          ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
          <div class="text-content">${section.data || ''}</div>
        </div>
      `;

    case 'info-grid':
      const items = section.data as { label: string; value: string }[];
      if (!items || items.length === 0) return '';
      return `
        <div class="section">
          ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
          <div class="info-grid">
            ${items.filter(i => i.value).map(item => `
              <div class="info-item">
                <span class="info-label">${item.label}</span>
                <span class="info-value">${item.value}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'summary-cards':
      const cards = section.data as { label: string; value: string; color?: string; sub?: string }[];
      if (!cards || cards.length === 0) return '';
      return `
        <div class="section">
          ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
          <div class="summary-cards">
            ${cards.map(card => `
              <div class="summary-card">
                <div class="label">${card.label}</div>
                <div class="value ${card.color || 'neutral'}">${card.value}</div>
                ${card.sub ? `<div class="sub">${card.sub}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;

    case 'table':
      const tableData = section.data as {
        columns: { header: string; key: string; align?: 'left' | 'right'; bold?: boolean }[];
        rows: Record<string, any>[];
        footer?: Record<string, any>;
      };
      if (!tableData || !tableData.rows || tableData.rows.length === 0) {
        return `
          <div class="section">
            ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
            <p style="text-align: center; color: #9ca3af; padding: 16px 0;">Kayıt bulunamadı</p>
          </div>
        `;
      }
      return `
        <div class="section">
          ${section.title ? `<div class="section-title">${section.title}</div>` : ''}
          <table>
            <thead>
              <tr>
                ${tableData.columns.map(col => `<th class="${col.align === 'right' ? 'right' : ''}">${col.header}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableData.rows.map(row => `
                <tr>
                  ${tableData.columns.map(col => `<td class="${col.align === 'right' ? 'right' : ''} ${col.bold ? 'bold' : ''}">${row[col.key] ?? '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
            ${tableData.footer ? `
              <tfoot>
                <tr>
                  ${tableData.columns.map(col => `<td class="${col.align === 'right' ? 'right' : ''}">${tableData.footer![col.key] ?? ''}</td>`).join('')}
                </tr>
              </tfoot>
            ` : ''}
          </table>
        </div>
      `;

    default:
      return '';
  }
}

export function exportToPdf(options: PdfExportOptions) {
  const {
    title,
    subtitle,
    date,
    companyName = 'Azür Metal',
    sections,
    orientation = 'portrait',
  } = options;

  const now = new Date();
  const dateStr = date || `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;

  const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${title} - ${companyName}</title>
      ${generateStyles(orientation)}
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>${title}</h1>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="header-right">
          <div class="company">${companyName}</div>
          <div>Rapor Tarihi: ${dateStr}</div>
        </div>
      </div>
      
      ${sections.map(s => renderSection(s)).join('')}
      
      <div class="footer">
        ${companyName} &bull; Bu rapor ${dateStr} tarihinde oluşturulmuştur.
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up engelleyici aktif olabilir. Lütfen izin verin.');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to render then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  // Fallback if onload doesn't fire
  setTimeout(() => {
    printWindow.print();
  }, 1000);
}
