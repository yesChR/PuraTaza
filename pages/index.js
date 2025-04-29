import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import PuraTaza from "@/components/PuraTaza/PuraTaza";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-col items-center justify-center">
        <h1 className={`${geistSans.className} text-4xl font-bold`}>Pura Taza</h1>
        <p className={`${geistMono.className} text-lg mt-4`}>
          Un proyecto de detección de objetos en tiempo real.
        </p>
      </div>
      <div className="mt-8">
        <PuraTaza />
      </div>
    </main>
  );
}
