/** Max width for the customer-facing mobile app shell (shop, cart, account). */
export const SHOP_SHELL_MAX_WIDTH = '430px';

export const shopShellClass =
  'relative mx-auto flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[var(--color-brand-bg)] md:max-w-none md:shadow-none max-w-[430px] shadow-2xl';

/** Centered fixed overlays inside the shop shell on wide viewports. */
export const shopFixedClass =
  'fixed inset-x-0 mx-auto z-50 w-full max-w-[430px] md:inset-auto md:right-6 md:translate-x-0';

export const adminShellClass = 'mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-[var(--color-brand-bg)]';
