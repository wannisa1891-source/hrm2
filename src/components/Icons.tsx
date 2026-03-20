export const Building = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M16 10h.01M8 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);

export const Users = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const Plus = ({ size = 24, color = 'currentColor', strokeWidth = 2, ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Edit2 = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

export const Trash2 = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const Search = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const ChevronRight = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const SearchCode = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 9L7 11.5 9 14" />
    <path d="M15 9l2 2.5L15 14" />
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export const X = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const UserIcon = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export const Briefcase = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const Contact = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2" />
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="12" cy="10" r="2" />
    <line x1="8" y1="2" x2="8" y2="4" />
    <line x1="16" y1="2" x2="16" y2="4" />
  </svg>
);

export const Phone = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const MapPin = ({ size = 24, color = 'currentColor', ...props }: any) => (
  <svg width={size} height={size} stroke={color} fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
