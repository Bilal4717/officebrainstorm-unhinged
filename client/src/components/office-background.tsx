import { ReactNode } from 'react';

interface OfficeBackgroundProps {
  children: ReactNode;
}

export function OfficeBackground({ children }: OfficeBackgroundProps) {
  return (
    <div className="min-h-screen font-office-body office-background">
      {children}
    </div>
  );
}