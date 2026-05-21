import { normalizeTextInputValue } from './normalizeInputValue';

export const trimPastedText = (value) => normalizeTextInputValue(value).replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/gu, '');

const hasPasteTrimOptOut = (target) => {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('[data-paste-trim="off"]'));
};

const isPasteSanitizableField = (target) => {
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) return false;
    if (target.disabled || target.readOnly) return false;
    if (target.isContentEditable || hasPasteTrimOptOut(target)) return false;
    if (target instanceof HTMLTextAreaElement) return true;
    return !['checkbox', 'radio', 'file', 'range', 'color', 'submit', 'button', 'image', 'reset'].includes(target.type);
};

export const applyTrimmedPaste = (event) => {
    const target = event.target;
    if (!isPasteSanitizableField(target)) return;

    const rawText = event.clipboardData?.getData('text');
    if (typeof rawText !== 'string') return;

    const sanitizedText = trimPastedText(rawText);
    if (sanitizedText === rawText) return;

    event.preventDefault();
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? start;
    target.setRangeText(sanitizedText, start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
};
