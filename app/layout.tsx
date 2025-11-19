import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Button Panel',
  description: 'Webhook button panel with admin controls',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          button {
            font-family: inherit;
          }

          input, select, textarea {
            font-family: inherit;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
