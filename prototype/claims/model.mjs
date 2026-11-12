// Fictional, browser-only defect-case model. No wallet, manufacturer authentication or payments.
export const STORAGE_KEY = 'recallbond:defect-demo:v1';
export const STATUSES = Object.freeze({
  submitted: 'Submitted',
  under_review: 'Under review',
  needs_information: 'More information requested',
  repair_approved: 'Repair approved · demo',
  replacement_approved: 'Replacement approved · demo',
  declined: 'Declined · demo',
});
export const PRODUCTS = Object.freeze({
  'RB-NV-002891': { name: 'NovaBook Air', model: 'NovaBook Air', manufacturer: 'NovaTech' },
  'RB-NV-002892': { name: 'NovaPhone S2', model: 'NovaPhone S2', manufacturer: 'NovaTech' },
});
export const CATEGORIES = Object.freeze({
  display: 'Display or screen',
  battery: 'Battery or charging',
  software: 'Software',
  hardware: 'Other hardware',
  other: 'Other issue',
});
const NEXT = Object.freeze({
  submitted: ['under_review', 'needs_information', 'repair_approved', 'replacement_approved', 'declined'],
  under_review: ['needs_information', 'repair_approved', 'replacement_approved', 'declined'],
  needs_information: ['under_review', 'declined'],
  repair_approved: [], replacement_approved: [], declined: [],
});
const has = (object, value) => Object.prototype.hasOwnProperty.call(object, value);
const isISODate = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && value.length < 40;
const safeText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const isValidCase = value => Boolean(value && typeof value === 'object' &&
  typeof value.id === 'string' && /^RB-CASE-[a-z0-9-]{8,48}$/i.test(value.id) &&
  has(PRODUCTS, value.passportId) && has(CATEGORIES, value.category) &&
  has(STATUSES, value.status) && typeof value.description === 'string' &&
  value.description.length <= 500 && isISODate(value.createdAt));
export function loadCases(storage) {
  try {
    const data = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data.filter(isValidCase).slice(0, 50) : [];
  } catch { return []; } // Corrupt or disabled local storage must not crash the app.
}
function persist(storage, cases) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(cases.slice(0, 50))); }
  catch { throw new Error('Browser storage unavailable. The example report was not saved.'); }
}
export function submitCase(storage, input, { idFactory = () => crypto.randomUUID(), now = () => new Date().toISOString() } = {}) {
  const passportId = safeText(input?.passportId, 64);
  const category = safeText(input?.category, 32);
  const description = safeText(input?.description, 501);
  const observedAt = safeText(input?.observedAt, 10);
  if (!has(PRODUCTS, passportId)) throw new Error('Select one of the example passports.');
  if (!has(CATEGORIES, category)) throw new Error('Select a defect category.');
  if (description.length < 12 || description.length > 500) throw new Error('Please describe the issue in 12–500 characters.');
  if (observedAt && !/^\d{4}-\d{2}-\d{2}$/.test(observedAt)) throw new Error('Enter a valid date.');
  const createdAt = now();
  const entry = {
    id: 'RB-CASE-' + String(idFactory()).replace(/[^a-z0-9-]/gi, '').slice(0, 36),
    passportId, category, description, observedAt,
    status: 'submitted', createdAt, updatedAt: createdAt, history: [{ status: 'submitted', date: createdAt, note: 'Consumer submitted a fictional report.' }],
    // Intentionally no image bytes, private identity, IMEI or warranty data.
  };
  const existing = loadCases(storage);
  if (existing.length >= 50) throw new Error('Demo inbox full. Clear the browser-only sample cases first.');
  if (existing.some(c => c.id === entry.id)) throw new Error('Duplicate case identifier. Please retry.');
  persist(storage, [entry, ...existing]);
  return entry;
}
export function transitionCase(storage, id, nextStatus, note = '', { now = () => new Date().toISOString() } = {}) {
  if (!has(STATUSES, nextStatus)) throw new Error('Unknown case status.');
  const cases = loadCases(storage), index = cases.findIndex(c => c.id === id);
  if (index < 0) throw new Error('Case not found in this browser.');
  const current = cases[index];
  if (!NEXT[current.status]?.includes(nextStatus)) throw new Error('That review transition is not permitted.');
  const detail = safeText(note, 501);
  if (detail.length > 500) throw new Error('Review notes must be 500 characters or fewer.');
  if (['needs_information', 'declined'].includes(nextStatus) && detail.length < 8)
    throw new Error('Provide at least 8 characters explaining this decision.');
  const date = now();
  const updated = { ...current, status: nextStatus, updatedAt: date,
    history: [...(Array.isArray(current.history) ? current.history : []), { status: nextStatus, date, note: detail }] };
  cases[index] = updated;
  persist(storage, cases);
  return updated;
}
export function availableTransitions(status) { return [...(NEXT[status] || [])]; }
export function clearCases(storage) {
  try { storage.removeItem(STORAGE_KEY); }
  catch { throw new Error('Unable to clear browser storage.'); }
}
