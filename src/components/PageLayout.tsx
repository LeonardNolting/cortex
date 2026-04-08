import { ReactNode } from "react";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <main className="container mx-auto py-10 px-4">
      {children}
    </main>
  );
}
