/**
 * Utilitários de data à prova de problemas com fusos horários (Timezones).
 * Utilizam manipulação de strings e Regex para evitar conversões indesejadas pelo construtor Date.
 */

/**
 * Normaliza qualquer formato de data (YYYY-MM-DD, ISO string, DD/MM/YYYY) para "YYYY-MM-DD".
 * Retorna null se a data for inválida ou "A definir".
 */
export function normalizeDateToYYYYMMDD(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'a definir' || trimmed.toLowerCase() === 'sem data') {
    return null;
  }

  // Caso 1: Começa com YYYY-MM-DD (ex: "2026-10-24" ou "2026-10-24T00:00:00.000Z")
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month}-${day}`;
  }

  // Caso 2: DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Formata uma data no formato brasileiro "DD/MM/YYYY" sem risco de distorção de fuso horário.
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr) return 'A definir';
  const normalized = normalizeDateToYYYYMMDD(dateStr);
  if (!normalized) return dateStr;

  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}
