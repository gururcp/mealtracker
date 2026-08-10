import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

// App icon: emerald rounded square with a stylised leaf mark.
// The Leaf path is Lucide's — permissive-licensed, well-recognised.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%)',
        }}
      >
        <svg
          width="60%"
          height="60%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.8.66c-.2 4.85-1.24 10.09-5.14 13.28C13.75 18.87 11 20 11 20z" />
          <path d="M2 21c0-3 2.7-5.7 5.7-5.7" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
