'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Don't show back button on login or dashboard pages
  if (pathname === '/login' || pathname === '/dashboard') return null;

  return (
    <button 
      onClick={() => router.back()} 
      className="btn-global-back"
      title="ย้อนกลับ"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"></path>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      ย้อนกลับ
    </button>
  );
}
