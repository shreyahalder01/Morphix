import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');

    if (!name) {
      return NextResponse.json({ error: 'Missing preview name.' }, { status: 400 });
    }

    const previewPath = path.join(process.cwd(), 'data', 'previews', name);
    if (!fs.existsSync(previewPath)) {
      return NextResponse.json({ error: 'Preview not found.' }, { status: 404 });
    }

    const file = fs.readFileSync(previewPath);
    return new NextResponse(file, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `inline; filename="${name}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to serve preview.' }, { status: 500 });
  }
}
