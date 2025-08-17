import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  console.log(`🖼️ Poster API: Requesting ${url}`);

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Forward the request to the backend poster proxy
    const backendUrl = `http://localhost:3001/proxy/poster?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(backendUrl);
    
    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Access-Control-Allow-Origin', '*');
    
    // Return the image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Poster API error:', error);
    
    // Return a simple SVG placeholder
    const placeholderSvg = `
      <svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1a1a1a"/>
        <rect x="10" y="10" width="280" height="430" fill="none" stroke="#333" stroke-width="2" stroke-dasharray="5,5"/>
        <text x="150" y="200" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">Movie Poster</text>
        <text x="150" y="230" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">Not Available</text>
        <circle cx="150" cy="280" r="30" fill="none" stroke="#333" stroke-width="2"/>
        <path d="M135 270 L150 285 L165 270" stroke="#333" stroke-width="2" fill="none"/>
      </svg>
    `;
    
    const headers = new Headers();
    headers.set('Content-Type', 'image/svg+xml');
    
    return new NextResponse(placeholderSvg, {
      status: 200,
      headers,
    });
  }
}

export async function HEAD(request: NextRequest) {
  // Handle HEAD requests for image checking
  return GET(request);
}
