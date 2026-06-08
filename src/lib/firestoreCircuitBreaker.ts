const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000;

type CircuitState = {
  openUntil: number;
  lastError: string;
};

const globalForFirestoreCircuit = globalThis as typeof globalThis & {
  __ujFirestoreCircuit?: CircuitState;
};

const state = globalForFirestoreCircuit.__ujFirestoreCircuit ?? {
  openUntil: 0,
  lastError: '',
};

globalForFirestoreCircuit.__ujFirestoreCircuit = state;

export function isFirestoreQuotaError(error: unknown) {
  const message = String((error as any)?.message || error || '');
  const code = String((error as any)?.code || '');
  return code === 'resource-exhausted'
    || code === '8'
    || message.includes('RESOURCE_EXHAUSTED')
    || message.includes('Quota exceeded')
    || message.includes('timed out')
    || message.includes('timeout');
}

export function recordFirestoreError(error: unknown, cooldownMs = DEFAULT_COOLDOWN_MS) {
  if (!isFirestoreQuotaError(error)) return;
  state.openUntil = Date.now() + cooldownMs;
  state.lastError = String((error as any)?.message || error || 'Firestore quota exceeded');
}

export function isFirestoreCircuitOpen() {
  return Date.now() < state.openUntil;
}

export function getFirestoreCircuitState() {
  return {
    open: isFirestoreCircuitOpen(),
    openUntil: state.openUntil ? new Date(state.openUntil).toISOString() : null,
    lastError: state.lastError,
  };
}

export function assertFirestoreCircuitClosed() {
  if (!isFirestoreCircuitOpen()) return;
  const { openUntil, lastError } = getFirestoreCircuitState();
  throw new Error(`Firestore circuit is open until ${openUntil}: ${lastError}`);
}
