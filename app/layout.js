import "./globals.css";
export const metadata = { title: "Pansiyon Takip", description: "Pansiyon yoklama ve izin takip sistemi" };
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0d3b8e" };
export default function Layout({ children }) {
  return (<html lang="tr"><body>{children}</body></html>);
}
