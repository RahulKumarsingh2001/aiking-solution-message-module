'use client';

import { useMemo, useState } from 'react';
import Papa from 'papaparse';

const templates = [
  { value: 'EMI_REMINDER', label: 'EMI Reminder' },
  { value: 'PAYMENT_CONFIRMATION', label: 'Payment Confirmation' },
  { value: 'KYC_REMINDER', label: 'KYC Reminder' },
  { value: 'LOAN_APPROVAL', label: 'Loan Approval' },
  { value: 'LOAN_REJECTION', label: 'Loan Rejection' },
  { value: 'DOCUMENT_PENDING', label: 'Document Pending' },
  { value: 'WELCOME', label: 'Welcome Message' },
  { value: 'FESTIVAL', label: 'Festival Greeting' },
  { value: 'STATEMENT', label: 'Account Statement' },
  { value: 'DEBIT_ALERT', label: 'Debit Alert' },
  { value: 'CREDIT_ALERT', label: 'Credit Alert' },
  { value: 'CARD_DELIVERY', label: 'Card Delivery' },
  { value: 'OTP', label: 'OTP' },
  { value: 'COLLECTION_REMINDER', label: 'Collection Reminder' },
  { value: 'CUSTOM', label: 'Custom Template' },
];

const templateMessages: Record<string, string> = {
  EMI_REMINDER: 'Dear {{name}},\n\nYour EMI of ₹{{amount}} is due on {{due_date}}.\n\nPlease pay before the due date.\n\nABC Bank',
  PAYMENT_CONFIRMATION: 'Dear {{name}},\n\nYour payment of ₹{{amount}} has been successfully received.\n\nTransaction ID: {{transaction_id}}\n\nThank you,\nABC Bank',
  KYC_REMINDER: 'Dear {{name}},\n\nYour KYC is pending. Please complete it to avoid service interruption.\n\nABC Bank',
  LOAN_APPROVAL: 'Dear {{name}},\n\nYour loan request has been approved.\n\nABC Bank',
  LOAN_REJECTION: 'Dear {{name}},\n\nYour loan request has been rejected. Please contact support.\n\nABC Bank',
  DOCUMENT_PENDING: 'Dear {{name}},\n\nPlease submit the pending documents to continue.\n\nABC Bank',
  WELCOME: 'Welcome {{name}} to ABC Bank. We are glad to have you onboard.',
  FESTIVAL: 'Dear {{name}},\n\nWishing you a joyful festival season.\n\nABC Bank',
  STATEMENT: 'Dear {{name}},\n\nYour account statement is ready.\n\nABC Bank',
  DEBIT_ALERT: 'Dear {{name}},\n\nA debit transaction of ₹{{amount}} has been posted to your account.\n\nABC Bank',
  CREDIT_ALERT: 'Dear {{name}},\n\nA credit transaction of ₹{{amount}} has been posted to your account.\n\nABC Bank',
  CARD_DELIVERY: 'Dear {{name}},\n\nYour card has been dispatched to your registered address.\n\nABC Bank',
  OTP: 'Dear {{name}},\n\nYour OTP is {{transaction_id}}. Do not share it with anyone.',
  COLLECTION_REMINDER: 'Dear {{name}},\n\nA collection reminder for ₹{{amount}} is due on {{due_date}}.\n\nABC Bank',
  CUSTOM: 'Hello {{name}},\n\nThis is a custom campaign message.\n\nABC Bank',
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [intent, setIntent] = useState('EMI_REMINDER');
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const totalRecipients = rows.length;

  const analytics = useMemo(() => ({
    total: totalRecipients,
    delivered: 0,
    failed: 0,
    successRate: totalRecipients ? '0%' : '0%'
  }), [totalRecipients]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrors(['File size exceeds 15MB']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    setStatus('Parsing CSV...');

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = (results.data as any[]).filter(Boolean);

        // Normalize rows: support various common header names
        const normalized = parsedRows.map((row) => {
          const firstName = row.name || row.FirstName || row.firstName || '';
          const lastName = row.LastName || row.lastName || row.Surname || '';
          const combinedName = `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim();

          const phoneRaw = row.phone || row.PhoneNumber || row.Phone || row.Mobile || row.phoneNumber || '';
          const digits = String(phoneRaw || '').replace(/\D/g, '');
          // If country code present (like 91...), try to take last 10 digits
          const phone = digits.length > 10 ? digits.slice(-10) : digits;

          return {
            name: combinedName || row.name || row.fullName || '',
            phone,
            amount: row.amount || row.Amount || row.Balance || '',
            due_date: row.due_date || row.DueDate || row.AccountOpenDate || '',
            account_number: row.account_number || row.AccountNumber || row.account || '',
            raw: row,
          };
        });

        // Filter out invalid rows (empty required fields)
        const invalids: string[] = [];
        const validRows = normalized.filter((r) => {
          if (!r.name || !r.phone) {
            invalids.push(`Missing required fields for row: ${JSON.stringify(r.raw)}`);
            return false;
          }
          if (!/^\d{10}$/.test(r.phone)) {
            invalids.push(`Invalid phone for ${r.name || 'unknown'}: ${r.phone}`);
            return false;
          }
          return true;
        });

        // Deduplicate by phone
        const deduped = validRows.filter((row, index, self) => index === self.findIndex((item) => item.phone === row.phone));

        setRows(deduped);
        const duplicateCount = validRows.length - deduped.length;

        setErrors([
          ...invalids,
          ...(duplicateCount > 0 ? [`Removed ${duplicateCount} duplicate(s)`] : []),
        ].filter(Boolean));

        setStatus(`Loaded ${deduped.length} valid recipients`);
        setPreview(buildPreview(deduped[0] || {}, intent));
      },
      error: () => {
        setErrors(['Unable to parse CSV']);
      },
    });
  };

  const buildPreview = (row: Record<string, string>, selectedIntent: string) => {
    const message = templateMessages[selectedIntent] || templateMessages.CUSTOM;
    return message
      .replace(/\{\{name\}\}/g, row.name || 'Customer')
      .replace(/\{\{amount\}\}/g, row.amount || '0')
      .replace(/\{\{due_date\}\}/g, row.due_date || 'TBD')
      .replace(/\{\{account_number\}\}/g, row.account_number || 'N/A')
      .replace(/\{\{transaction_id\}\}/g, row.transaction_id || 'N/A');
  };

  const handleIntentChange = (value: string) => {
    setIntent(value);
    setPreview(buildPreview(rows[0] || {}, value));
  };

  const startCampaign = async () => {
    if (!rows.length) {
      setStatus('Please upload a valid CSV first');
      return;
    }

    setLoading(true);
    setStatus('Creating campaign...');

    const response = await fetch('/api/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, intent, data: rows }),
    });

    const result = await response.json();
    setStatus(result.message || 'Campaign created');

    if (result.campaign) {
      // Send campaign payload to backend for Twilio dispatch
      const sendResp = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: result.campaign }),
      });
      const sendResult = await sendResp.json();
      setStatus(sendResult.message || `Sent: ${sendResult.delivered || 0}, Failed: ${sendResult.failed || 0}`);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Banking Campaign Automation</p>
          <h1 className="mt-2 text-3xl font-semibold">SMS & WhatsApp Campaign Module</h1>
          <p className="mt-3 max-w-2xl text-slate-400">Upload customer data, select a template, preview personalized messages, and dispatch bulk campaigns.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <h2 className="text-xl font-semibold">Create Campaign</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <span className="mb-2 block text-sm text-slate-400">Upload CSV</span>
                <input type="file" accept=".csv" onChange={handleFileUpload} className="w-full text-sm text-slate-300" />
              </label>

              <label className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <span className="mb-2 block text-sm text-slate-400">Communication Channel</span>
                <select value={channel} onChange={(e) => setChannel(e.target.value as 'sms' | 'whatsapp')} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
                  <option value="sms">SMS</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </label>

              <label className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <span className="mb-2 block text-sm text-slate-400">Intent / Template</span>
                <select value={intent} onChange={(e) => handleIntentChange(e.target.value)} className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2">
                  {templates.map((template) => (
                    <option key={template.value} value={template.value}>{template.label}</option>
                  ))}
                </select>
              </label>

              <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                <p className="text-sm text-slate-400">Status</p>
                <p className="mt-2 text-sm text-cyan-300">{status || 'Awaiting action'}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800/70 p-4">
              <h3 className="font-medium">Message Preview</h3>
              <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-950 p-4 text-sm text-slate-300">{preview || 'Select a template to preview the generated message.'}</pre>
            </div>

            <button onClick={startCampaign} disabled={loading} className="mt-6 rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? 'Processing...' : 'Start Campaign'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">Analytics</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Total Messages</p>
                  <p className="text-2xl font-semibold">{analytics.total}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Delivered</p>
                  <p className="text-2xl font-semibold">{analytics.delivered}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Failed</p>
                  <p className="text-2xl font-semibold">{analytics.failed}</p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-4">
                  <p className="text-sm text-slate-400">Success Rate</p>
                  <p className="text-2xl font-semibold">{analytics.successRate}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">Validation Report</h2>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {errors.length ? errors.map((error, index) => <li key={index} className="rounded-lg border border-red-900/40 bg-red-950/30 p-2">{error}</li>) : <li className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 p-2">No validation issues detected.</li>}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
