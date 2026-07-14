import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { SettingsService } from '@/app/services/SettingsService';
import { SettingsUpdateSchema } from '@/app/lib/validations';

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
    
    // Zod validation
    const result = SettingsUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const user = await SettingsService.updateSettings(session.user.email, result.data);

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
