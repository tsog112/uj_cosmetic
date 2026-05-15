import AnnouncementBar from '@/components/layout/AnnouncementBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ChatAssistant from '@/components/ui/ChatAssistant';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnnouncementBar />
      <Header />
      {/* No pt here – hero section is full-bleed behind transparent header.
          Non-hero pages like /shop and /about set their own top padding. */}
      <main className="flex-1 min-h-screen pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <ChatAssistant />
    </>
  );
}
