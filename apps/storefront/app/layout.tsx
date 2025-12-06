export const metadata = {
  title: 'ShopAustralia - Compare Suppliers',
  description: 'Smart dropshipping comparison engine',
};

export default function RootLayout({ children }: { children: any }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
