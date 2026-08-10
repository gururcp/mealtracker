import { ImageResponse } from 'next/og';

// iOS home-screen icon. iOS applies its own rounding, so we draw a flat
// filled square (no rounded corners) and rely on the OS to shape it.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
