import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-white text-neutral-900">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-4">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
