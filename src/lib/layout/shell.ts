/** Max width for the customer-facing mobile app shell (shop, cart, account). */
export const SHOP_SHELL_MAX_WIDTH = '430px';

export const shopShellClass =
  'relative mx-auto flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[var(--color-brand-bg)] md:max-w-none md:shadow-none max-w-[430px] shadow-2xl';

/** Centered fixed overlays inside the shop shell on wide viewports. */
export const shopFixedClass =
  'fixed inset-x-0 mx-auto z-50 w-full max-w-[430px] md:inset-auto md:right-6 md:translate-x-0';

/** Layout main bottom padding on mobile (clears fixed tab bar) */
export const MOBILE_LAYOUT_BOTTOM_PAD_PX = 85;

/** Extend a dark site footer through the mobile tab bar area */
export const mobileSiteFooterClass = `-mb-[85px] pb-[calc(85px+env(safe-area-inset-bottom)+1.25rem)] md:mb-0`;

/** Sticky footers above mobile bottom tab (64px) + safe area */
export const shopStickyFooterClass =
  'fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[var(--z-modal)] mx-auto w-full max-w-[430px] md:bottom-0 md:max-w-none';

/** Mobile chat FAB — default (above bottom tab) */
export const mobileChatFabClass =
  'bottom-[calc(72px+env(safe-area-inset-bottom))]';

/** Mobile chat FAB — above product-detail sticky CTA only */
export const mobileChatFabProductStickyClass =
  'bottom-[calc(156px+env(safe-area-inset-bottom))] right-4';

/** Scroll padding when cart sticky summary + tab bar */
export const mobileCartScrollPadClass =
  'pb-[calc(168px+env(safe-area-inset-bottom))]';

/** Checkout: sticky pay bar (~112px) + tab bar (64px) + зай */
export const checkoutScrollPadClass =
  'pb-[calc(200px+64px+env(safe-area-inset-bottom))] md:pb-28';

export const adminShellClass =
  'mx-auto flex min-h-[100dvh] w-full max-w-3xl flex-col bg-[var(--color-bg)] md:max-w-none';
