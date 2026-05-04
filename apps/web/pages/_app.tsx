import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Source_Serif_4, JetBrains_Mono } from "next/font/google";

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${serif.variable} ${mono.variable}`}>
      <Component {...pageProps} />
      {process.env.NEXT_PUBLIC_IS_VERCEL && <Analytics />}
      {process.env.NEXT_PUBLIC_IS_VERCEL && <SpeedInsights />}
    </div>
  );
}
