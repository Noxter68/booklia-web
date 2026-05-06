import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = "Booklia — L'app tout-en-un pour les indépendants";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Dot grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.5,
          }}
        />

        {/* Top gradient fade */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '180px',
            background: 'linear-gradient(to bottom, #ffffff, transparent)',
          }}
        />
        {/* Bottom gradient fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '180px',
            background: 'linear-gradient(to top, #ffffff, transparent)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px',
            position: 'relative',
            zIndex: 10,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: '96px',
              height: '96px',
              borderRadius: '24px',
              backgroundColor: '#111111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: '#ffffff',
                fontSize: '56px',
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: '-2px',
              }}
            >
              B
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <span
              style={{
                fontSize: '64px',
                fontWeight: 800,
                color: '#111111',
                letterSpacing: '-2px',
                lineHeight: 1.1,
              }}
            >
              Booklia
            </span>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 500,
                color: '#6b7280',
                letterSpacing: '-0.5px',
              }}
            >
              L&apos;app tout-en-un pour les indépendants
            </span>
          </div>

          {/* Feature chips */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {['Réservations', 'Fiches clients', 'Factures', 'Comptabilité'].map((label) => (
              <div
                key={label}
                style={{
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: '999px',
                  padding: '8px 20px',
                  fontSize: '18px',
                  fontWeight: 500,
                  color: '#374151',
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
