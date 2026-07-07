import Script from 'next/script';

type GoogleAnalyticsProps = {
  measurementId: string | undefined;
};

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const id = measurementId?.trim();

  if (!id) {
    return null;
  }

  const encodedId = encodeURIComponent(id);
  const serializedId = JSON.stringify(id);

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodedId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${serializedId});
        `}
      </Script>
    </>
  );
}
