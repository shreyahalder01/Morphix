import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Morphix — AI Mixed-Media Video Studio',
  description: 'Turn videos into cinematic AI mixed-media art. Anime, claymation, sketch, collage, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="ambient" aria-hidden />
        {children}
      </body>
    </html>
  );
}
