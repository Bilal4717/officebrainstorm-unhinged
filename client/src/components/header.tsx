import { Building } from "lucide-react";

export function Header() {
  return (
    <header className="bg-office-orange shadow-lg border-b-4 border-office-black">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-office-black rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-8 h-8 text-office-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4 text-office-white/90">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
