import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { ModelProvider } from '@/store/model';
import { Shell } from '@/components/Shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif-display' });

export const metadata: Metadata = {
  title: 'Senior Living Acquisition and Turnaround Intelligence | Independent Case Study',
  description: 'Independent retrospective scenario analysis of two completed senior living acquisitions. Not affiliated with or endorsed by Cima Investment Group.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body>
        <ModelProvider><Shell>{children}</Shell></ModelProvider>
      </body>
    </html>
  );
}
