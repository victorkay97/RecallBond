// Shared browser-only demo UI for consumer issue reporting and fictional issuer review.
// Local storage is shared between /app and /business ONLY on the same browser+origin.
// This is intentionally not an authenticated service or an onchain workflow.
import { PRODUCTS, CATEGORIES, STATUSES, loadCases, submitCase, transitionCase, availableTransitions, clearCases } from './model.mjs';
const consumerHost = document.getElementById('consumer-claims');
const businessHost = document.getElementById('business-claims');
const $ = (tag, className, value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
};
const formatDate = value => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
};
function statusPill(status) {
  const element = $('span', 'status-pill ' + (status === 'declined' ? 'gold' : status === 'submitted' ? 'neutral' : ''), STATUSES[status] || 'Unknown');
  return element;
}
function notice(message) {
  const region = document.getElementById('toast');
  if (region) {
    region.textContent = message; region.classList.add('show');
    setTimeout(() => { if (region.textContent === message) region.classList.remove('show'); }, 6000);
  }
}
let returnFocus = null;
function closeDialog() {
  const layer = document.getElementById('claim-dialog-layer');
  if (!layer) return;
  layer.remove();
  document.body.style.overflow = '';
  if (returnFocus?.isConnected) returnFocus.focus();
}
function makeDialog(title, subtitle) {
  closeDialog();
  returnFocus = document.activeElement;
  const layer = $('div', 'dialog-layer claims-dialog-layer');
  layer.id = 'claim-dialog-layer';
  const modal = $('section', 'dialog claims-dialog');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'claims-dialog-title');
  const header = $('div', 'dialog-head');
  const heading = $('div');
  heading.append($('span', 'eyebrow', 'DEFECT SUPPORT · BROWSER DEMO'));
  const h2 = $('h2', '', title); h2.id = 'claims-dialog-title'; heading.append(h2);
  const closeButton = $('button', 'dialog-close', '×');
  closeButton.type = 'button'; closeButton.setAttribute('aria-label', 'Close dialog');
  closeButton.addEventListener('click', closeDialog);
  header.append(heading, closeButton);
  modal.append(header, $('p', 'small muted', subtitle));
  layer.append(modal);
  layer.addEventListener('click', e => { if (e.target === layer) closeDialog(); });
  layer.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(); }
    if (e.key !== 'Tab') return;
    const focusable = [...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  document.body.append(layer);
  document.body.style.overflow = 'hidden';
  closeButton.focus();
  return modal;
}
function field(form, label, input) {
  const box = $('div', 'form-field');
  const text = $('label', '', label);
  text.htmlFor = input.id;
  box.append(text, input); form.append(box);
}
function footer(form, actionLabel) {
  const actions = $('div', 'dialog-actions');
  const cancel = $('button', 'btn soft', 'Cancel'); cancel.type = 'button';
  cancel.addEventListener('click', closeDialog);
  const submit = $('button', 'btn primary', actionLabel); submit.type = 'submit';
  actions.append(cancel, submit); form.append(actions);
}
function openReport() {
  const passportId = document.getElementById('selected-id')?.textContent?.trim();
  const product = PRODUCTS[passportId];
  if (!product) return notice('Select a sample passport before filing a report.');
  const modal = makeDialog('Report a product issue', 'Raise a fictional warranty-support request. This is not sent to NovaTech or any real manufacturer.');
  const form = $('form');
  const summary = $('div', 'item-row');
  const productText = $('div');
  productText.append($('b', '', product.name), $('small', '', passportId + ' · Registered sample passport'));
  summary.append(productText, statusPill('submitted')); form.append(summary);
  const category = $('select'); category.id = 'claim-category'; category.required = true;
  category.append(new Option('Choose an issue category', '', true, true));
  for (const [key, value] of Object.entries(CATEGORIES)) category.append(new Option(value, key));
  field(form, 'What went wrong?', category);
  const description = $('textarea'); description.id = 'claim-description';
  description.required = true; description.minLength = 12; description.maxLength = 500;
  description.rows = 4; description.placeholder = 'For example: A vertical green line appeared on my screen even though I did not drop my phone.';
  field(form, 'Describe the issue (12–500 characters)', description);
  const observed = $('input'); observed.id = 'claim-observed'; observed.type = 'date';
  observed.max = new Date().toISOString().slice(0, 10);
  field(form, 'When did you notice it? (optional)', observed);
  const image = $('input'); image.id = 'claim-photo'; image.type = 'file'; image.accept = 'image/png,image/jpeg,image/webp';
  field(form, 'Photo (visual preview only — not uploaded or saved)', image);
  const selection = $('p', 'small muted', 'No photo selected. Evidence files are deliberately not stored in this prototype.');
  image.addEventListener('change', () => {
    const file = image.files?.[0];
    selection.textContent = file ? (file.name + ' selected · This file will NOT be stored, sent or reviewed.') : 'No photo selected.';
  });
  form.append(selection);
  form.append($('p', 'notice warn', 'Demo only: details are stored in THIS browser for cross-screen walkthroughs. Do not enter real personal or sensitive information. Warranty coverage is not automatically verified, and submitting creates no legal claim or financial credit.'));
  const error = $('p', 'claim-error'); error.setAttribute('role', 'alert'); form.append(error);
  footer(form, 'Submit demo report');
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    try {
      if (image.files?.[0] && (!['image/png','image/jpeg','image/webp'].includes(image.files[0].type) || image.files[0].size > 2*1024*1024))
        throw new Error('Choose a PNG, JPEG or WebP image under 2 MB (not uploaded).');
      const entry = submitCase(localStorage, {
        passportId, category: category.value, description: description.value, observedAt: observed.value,
      });
      closeDialog(); renderAll();
      notice('Fictional case ' + entry.id + ' saved in this browser. Open the Business Claims tab to review it.');
    } catch (err) { error.textContent = err.message || 'Could not save this report.'; }
  });
  modal.append(form); category.focus();
}
function openReview(caseId) {
  const entry = loadCases(localStorage).find(item => item.id === caseId);
  if (!entry) return notice('That example case is no longer available.');
  const allowed = availableTransitions(entry.status);
  const modal = makeDialog('Review ' + entry.id, 'Fictional NovaTech reviewer · No manufacturer authentication, delivery, repairs or real compensation.');
  const summary = $('div', 'claim-review-summary');
  summary.append($('b', '', PRODUCTS[entry.passportId].name + ' · ' + CATEGORIES[entry.category]));
  summary.append($('p', 'small muted', entry.description));
  summary.append(statusPill(entry.status));
  modal.append(summary);
  if (!allowed.length) { modal.append($('p', 'notice', 'This example case is in a final state; no additional decisions are permitted.')); return; }
  const form = $('form');
  const choice = $('select'); choice.id = 'claim-decision'; choice.required = true;
  choice.append(new Option('Choose a review outcome', '', true, true));
  for (const value of allowed) choice.append(new Option(STATUSES[value], value));
  field(form, 'Review action', choice);
  const comment = $('textarea'); comment.id = 'claim-note'; comment.rows = 3; comment.maxLength = 500;
  comment.placeholder = 'Explain the review decision. Required for declined and more-information requests.';
  field(form, 'Review note (up to 500 characters)', comment);
  form.append($('p', 'notice warn', 'These are simulation outcomes only. Approving a repair or replacement neither verifies a warranty nor transfers any money.'));
  const error = $('p', 'claim-error'); error.setAttribute('role','alert'); form.append(error);
  footer(form, 'Save demo decision');
  form.addEventListener('submit', e => {
    e.preventDefault(); error.textContent = '';
    try {
      transitionCase(localStorage, caseId, choice.value, comment.value);
      closeDialog(); renderAll(); notice('Fictional manufacturer decision saved in this browser.');
    } catch (err) { error.textContent = err.message || 'Could not change status.'; }
  });
  modal.append(form); choice.focus();
}
function buildCase(entry, showReview) {
  const outer = $('article', 'claim-case');
  const top = $('div', 'claim-case-heading');
  const label = $('div');
  label.append($('b', '', PRODUCTS[entry.passportId].name), $('small', '', entry.id + ' · ' + formatDate(entry.createdAt)));
  top.append(label, statusPill(entry.status)); outer.append(top);
  outer.append($('p', 'claim-case-description', entry.description));
  const meta = $('div', 'claim-case-meta', CATEGORIES[entry.category] + ' · ' + entry.passportId);
  outer.append(meta);
  const history = Array.isArray(entry.history) ? entry.history : [];
  const latest = history.at(-1);
  if (latest?.note) outer.append($('p', 'claim-case-note', 'Latest update: ' + latest.note));
  if (showReview) {
    const actions = $('div', 'flex wrap-flex');
    const button = $('button', 'btn soft', availableTransitions(entry.status).length ? 'Review case' : 'Decision recorded');
    button.type = 'button'; button.disabled = availableTransitions(entry.status).length === 0;
    button.addEventListener('click', () => openReview(entry.id));
    actions.append(button); outer.append(actions);
  }
  return outer;
}
function renderConsumer() {
  if (!consumerHost) return;
  consumerHost.replaceChildren();
  const cases = loadCases(localStorage);
  const heading = $('div', 'section-head');
  heading.append($('h2', 'section-title', 'Reported issues'), $('span', 'status-pill neutral', cases.length + ' demo case' + (cases.length === 1 ? '' : 's')));
  consumerHost.append(heading);
  if (!cases.length) {
    consumerHost.append($('p', 'small muted', 'No issues reported in this browser. Select a product above and use Report an issue to start a sample warranty-support case.'));
  } else for (const entry of cases) consumerHost.append(buildCase(entry, false));
  consumerHost.append($('p', 'notice', 'These case statuses are local demo records, not verified manufacturer decisions or onchain transactions.'));
}
function renderBusiness() {
  if (!businessHost) return;
  businessHost.replaceChildren();
  const cases = loadCases(localStorage);
  const heading = $('div', 'section-head');
  heading.append($('h2', 'section-title', 'Customer reports'), $('span', 'status-pill neutral', cases.length + ' demo case' + (cases.length === 1 ? '' : 's')));
  businessHost.append(heading);
  businessHost.append($('p', 'small muted', 'Reports submitted in the Consumer app appear here only when both pages use the same browser and origin. This is a fictional review queue, not a live support inbox.'));
  if (!cases.length) {
    const empty = $('div', 'claim-empty');
    empty.append($('b', '', 'No reported issues yet'), $('p', 'small muted', 'Open the consumer app, select NovaPhone S2, report a screen issue, then return here to review it.'));
    const link = $('a', 'btn soft', 'Open Consumer demo'); link.href = '../app/#collection';
    empty.append(link); businessHost.append(empty);
  } else for (const entry of cases) businessHost.append(buildCase(entry, true));
  const bottom = $('div', 'claims-bottom');
  bottom.append($('p', 'notice warn', 'All entries are stored locally. Do not use this preview for actual claims or upload sensitive evidence.'));
  const clear = $('button', 'btn soft', 'Clear browser demo cases'); clear.type = 'button';
  clear.addEventListener('click', () => {
    if (!confirm('Delete all fictional complaint records stored for this browser preview?')) return;
    try { clearCases(localStorage); renderAll(); notice('Local demo cases cleared.'); }
    catch (err) { notice(err.message); }
  });
  bottom.append(clear); businessHost.append(bottom);
}
function renderAll() { renderConsumer(); renderBusiness(); }
document.getElementById('open-defect-report')?.addEventListener('click', openReport);
window.addEventListener('storage', e => { if (!e.key || e.key === 'recallbond:defect-demo:v1') renderAll(); });
renderAll();
