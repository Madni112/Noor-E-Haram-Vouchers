import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AuthProvider } from '../lib/AuthContext';

export const metadata = {
  title: 'Cheepa FJ Travels — Umrah Package Vouchers & QR Portal',
  description: 'Official Umrah Package Vouchers with instant QR code verification and redirect portal.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100/70 min-h-screen flex flex-col antialiased selection:bg-amber-200 selection:text-emerald-950">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
