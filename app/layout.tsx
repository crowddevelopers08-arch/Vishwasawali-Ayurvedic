import type { Metadata } from "next";
import { Jost } from "next/font/google";
import Script from "next/script";
import { cldPng } from "@/lib/site";
import "./globals.css";

/* Single typeface across the whole site: Jost, per the brand's
   `font-family: 'Jost', system-ui, sans-serif`. */
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eclora Aesthetics | Share Your Review",
  description: "Tell us about your experience at Eclora Aesthetics.",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: cldPng("favicon-32"), sizes: "32x32", type: "image/png" },
      { url: cldPng("favicon-192"), sizes: "192x192", type: "image/png" },
    ],
    shortcut: cldPng("favicon-32"),
    apple: cldPng("apple-touch-icon"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),
                  dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-KSSTBC79');
          `}
        </Script>
        {/* End Google Tag Manager */}

        {/* Google tag (gtag.js) — Google Ads */}
        <Script
          id="gtag-js"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=AW-18275005989"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18275005989');
          `}
        </Script>

        {/* Click-to-call conversion. Exposes gtag_report_conversion for manual
            use, and fires it automatically for every tel: link on the site. */}
        <Script id="gtag-call-conversion" strategy="afterInteractive">
          {`
            window.gtag_report_conversion = function (url) {
              var callback = function () {
                if (typeof(url) != 'undefined') {
                  window.location = url;
                }
              };
              gtag('event', 'conversion', {
                'send_to': 'AW-18275005989/KCKgCP_0n_EcEKXsmYpE',
                'value': 1.0,
                'currency': 'INR',
                'event_callback': callback
              });
              return false;
            };
            document.addEventListener('click', function (e) {
              var el = e.target;
              if (!el || typeof el.closest !== 'function') return;
              if (!el.closest('a[href^="tel:"]')) return;
              gtag('event', 'conversion', {
                'send_to': 'AW-18275005989/KCKgCP_0n_EcEKXsmYpE',
                'value': 1.0,
                'currency': 'INR'
              });
            });
          `}
        </Script>
      </head>

      <body
        className={`${jost.variable} font-body antialiased selection:bg-[#3C4A3D] selection:text-[#FDFEF9]`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-KSSTBC79"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}

        {children}
      </body>
    </html>
  );
}