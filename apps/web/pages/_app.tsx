import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {process.env.NEXT_PUBLIC_IS_VERCEL && <Analytics />}
      {process.env.NEXT_PUBLIC_IS_VERCEL && <SpeedInsights />}
    </>
  );
}
