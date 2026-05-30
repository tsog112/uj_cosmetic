import DeliveryPortalClient from './DeliveryPortalClient';

interface PageProps {
  params: Promise<{
    date: string;
    token: string;
  }>;
}

export default async function DeliveryPage({ params }: PageProps) {
  const { date, token } = await params;
  return <DeliveryPortalClient date={date} token={token} />;
}
