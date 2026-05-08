import { getAuthToken } from '@/lib/cookies';
import { getApiBaseUrl } from '@/lib/api-url';

/**
 * Helpers para baixar arquivos CSV gerados no backend.
 * O navegador faz o download automaticamente.
 */

async function downloadCsv(path: string, suggestedFilename: string): Promise<void> {
  const token = getAuthToken();
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    let msg = `Erro ${res.status} ao baixar arquivo`;
    try {
      const body = await res.json();
      if (body.message) msg = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    } catch {
      // não-JSON
    }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);

  // Pega filename do header se houver, senão usa o sugerido.
  const disposition = res.headers.get('content-disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] ?? suggestedFilename;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const exportsService = {
  chartOfAccounts() {
    const today = new Date().toISOString().slice(0, 10);
    return downloadCsv(`/accounting/exports/chart-of-accounts.csv`, `plano-de-contas-${today}.csv`);
  },

  journalEntries(startDate: string, endDate: string) {
    const p = new URLSearchParams({ startDate, endDate });
    return downloadCsv(
      `/accounting/exports/journal-entries.csv?${p}`,
      `lancamentos-${startDate}-${endDate}.csv`,
    );
  },

  balancete(startDate: string, endDate: string, accountType?: string) {
    const p = new URLSearchParams({ startDate, endDate });
    if (accountType) p.set('accountType', accountType);
    return downloadCsv(
      `/accounting/exports/balancete.csv?${p}`,
      `balancete-${startDate}-${endDate}.csv`,
    );
  },

  dre(startDate: string, endDate: string) {
    const p = new URLSearchParams({ startDate, endDate });
    return downloadCsv(`/accounting/exports/dre.csv?${p}`, `dre-${startDate}-${endDate}.csv`);
  },

  balanco(referenceDate: string) {
    const p = new URLSearchParams({ referenceDate });
    return downloadCsv(`/accounting/exports/balanco.csv?${p}`, `balanco-${referenceDate}.csv`);
  },
};
