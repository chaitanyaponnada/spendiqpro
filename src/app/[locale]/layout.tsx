
import '../globals.css';
import * as React from 'react';
import Script from 'next/script';
import * as gtag from '@/lib/gtag';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/messages';
import MainContent from '@/components/layout/MainContent';


// Server component RootLayout
export default async function LocaleLayout({
  children,
  params: {locale}
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  const messages = await getMessages(locale);

  return (
    <>
        {/* Google Analytics Scripts can be placed here if they need locale */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_TRACKING_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gtag.GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
         <NextIntlClientProvider locale={locale} messages={messages}>
            <MainContent>{children}</MainContent>
        </NextIntlClientProvider>
    </>
  );
}
