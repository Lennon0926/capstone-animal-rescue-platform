import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      {process.env.NEXT_PUBLIC_IS_VERCEL && <Analytics />}
      {process.env.NEXT_PUBLIC_IS_VERCEL && <SpeedInsights />}
    </ErrorBoundary>
  );
}
