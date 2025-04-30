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
    <main
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/fondo3.png')", 
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center", 
      }}
    >
      {/* Logo circular */}
      <Image
        src="/logo.jpeg" 
        alt="Logo de Pura Taza"
        width={196} 
        height={250}
        priority 
        className="rounded-full border-5 shadow-2xl " 
      />
      {/* Título */}
      <h1
        className={`${geistSans.className} text-4xl font-bold text-center`}
        style={{
          color: "#4B3621", 
          textShadow: "2px 2px 4px rgba(75, 54, 33, 0.8)", 
          WebkitTextStroke: "1px #D2B48C", 
        }}
      >
        PuraTaza
      </h1>
      {/* Cámara */}
      <div className="w-full flex justify-center items-center">
        <div className="lg:w-lg lg:max-w-1/3 p-2 rounded-lg shadow-2xl mb-30 sm:w-full sm:max-w-xs">
          <PuraTaza />
        </div>
      </div>
    </main>
  );
}