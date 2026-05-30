'use client';

export default function DeliveryPortalClient({ date, token }: { date: string; token: string }) {
  return (
    <main className="min-h-screen bg-[#FFF8FB] p-6">
      <section className="mx-auto max-w-xl rounded-2xl border border-[#F4C0D1] bg-white p-6">
        <h1 className="text-xl font-semibold text-[#993556]">Хүргэлтийн портал</h1>
        <p className="mt-2 text-sm text-gray-500">Огноо: {date}</p>
        <p className="mt-1 text-xs text-gray-400">Token: {token.slice(0, 8)}...</p>
      </section>
    </main>
  );
}
