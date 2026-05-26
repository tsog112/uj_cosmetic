import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import ShopShell from '@/components/layout/ShopShell';
import ChatAssistant from '@/components/ui/ChatAssistant';
import BottomTabBar from '@/components/layout/BottomTabBar';
import DesktopNav from '@/components/layout/DesktopNav';
import HeaderSpacer from '@/components/layout/HeaderSpacer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShopShell>
      <AnnouncementBar />
      {/* Mobile header (hidden on desktop) */}
      <div className="md:hidden">
        <Header />
      </div>
      {/* Desktop nav (hidden on mobile) */}
      <DesktopNav />
      <HeaderSpacer />
      <main className="min-h-screen flex-1 pb-[85px] md:pb-0">
        {children}
      </main>
      <ChatAssistant />
      {/* Bottom tab only on mobile */}
      <div className="md:hidden">
        <BottomTabBar />
      </div>
    </ShopShell>
  );
}
