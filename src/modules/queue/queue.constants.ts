export const NOTE_PROCESSING_QUEUE = 'note-processing';

/**
 * Demo notes for the OpsCtrl Background jobs page. A title starting with
 * FAIL_NOTE_PREFIX simulates a downstream outage: its job fails for
 * DEMO_OUTAGE_MS after it was queued (all automatic attempts fail, so it
 * lands in Failed), then succeeds when retried. A title starting with
 * LATER_NOTE_PREFIX is queued DEMO_DELAY_MS in the future (Delayed), so it
 * can be promoted.
 */
export const FAIL_NOTE_PREFIX = '[fail]';
export const LATER_NOTE_PREFIX = '[later]';
export const DEMO_OUTAGE_MS = 60_000;
export const DEMO_DELAY_MS = 10 * 60_000;
