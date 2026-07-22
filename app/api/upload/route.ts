import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      size: file.size,
      message: 'Upload endpoint ready',
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
