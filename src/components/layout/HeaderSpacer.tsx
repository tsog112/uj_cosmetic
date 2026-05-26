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

  return (
    <>
      {/* Mobile spacer: 36px (Announcement) + 58px (Header) = 94px. Without announcement = 58px. */}
      <div
        className="w-full transition-all duration-300 md:hidden"
        style={{ height: hasAnnouncement ? 94 : 58 }}
      />
      
      {/* Desktop spacer: DesktopNav is 68px, plus some padding = 72px */}
      <div className="hidden w-full md:block h-[72px]" />
    </>
  );
}
