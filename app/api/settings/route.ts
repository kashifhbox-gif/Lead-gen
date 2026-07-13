import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SettingsService } from '@/app/services/SettingsService';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await SettingsService.getSettings(session.user.email);
    
    return NextResponse.json({ 
      aiPrompt: user.aiPrompt,
      apifyApiKey: user.apifyApiKey || '',
      geminiApiKey: user.geminiApiKey || '',
      geminiModel: user.geminiModel || 'gemini-2.5-flash'
    });
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Minimal validation
    if (body.aiPrompt && typeof body.aiPrompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt provided' }, { status: 400 });
    }

    const user = await SettingsService.updateSettings(session.user.email, body);

    return NextResponse.json({ 
      success: true, 
      aiPrompt: user.aiPrompt,
      apifyApiKey: user.apifyApiKey,
      geminiApiKey: user.geminiApiKey,
      geminiModel: user.geminiModel
    });
  } catch (error: any) {
    console.error('Settings PUT Error:', error);
    if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
