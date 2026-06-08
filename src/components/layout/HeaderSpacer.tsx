'use client';

import { useEffect, useState } from 'react';

export default function HeaderSpacer() {
  const [hasAnnouncement, setHasAnnouncement] = useState(true);

  useEffect(() => {
    const handleAnnouncementVisibility = (event: Event) => {
      setHasAnnouncement(Boolean((event as CustomEvent<boolean>).detail));
    };
    window.addEventListener('announcement-visibility-change', handleAnnouncementVisibility);
    return () => window.removeEventListener('announcement-visibility-change', handleAnnouncementVisibility);
  }, []);

  const mobileHeight = hasAnnouncement ? 94 : 58;
  const desktopHeight = hasAnnouncement ? 98 : 62;

  return (
    <>
      {/* Mobile: 36px announcement + 58px header = 94px */}
      <div
        className="w-full transition-all duration-300 md:hidden"
        style={{ height: mobileHeight }}
      />

      {/* Desktop: 36px announcement + 62px nav = 98px */}
      <div
        className="hidden w-full transition-all duration-300 md:block"
        style={{ height: desktopHeight }}
      />
    </>
  );
}
