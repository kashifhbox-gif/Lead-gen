import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectToDatabase from '@/app/lib/db';
import User from '@/app/models/User';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // We fetch by email because NextAuth session uses email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      aiPrompt: user.aiPrompt,
      apifyApiKey: user.apifyApiKey || '',
      geminiApiKey: user.geminiApiKey || '',
      geminiModel: user.geminiModel || 'gemini-2.5-flash'
    });
  } catch (error: any) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { aiPrompt, apifyApiKey, geminiApiKey, geminiModel } = await req.json();

    if (aiPrompt && typeof aiPrompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt provided' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Create an update object, only updating fields that were actually provided
    const updateData: any = {};
    if (aiPrompt !== undefined) updateData.aiPrompt = aiPrompt;
    if (apifyApiKey !== undefined) updateData.apifyApiKey = apifyApiKey;
    if (geminiApiKey !== undefined) updateData.geminiApiKey = geminiApiKey;
    if (geminiModel !== undefined) updateData.geminiModel = geminiModel;
    
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateData },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      aiPrompt: user.aiPrompt,
      apifyApiKey: user.apifyApiKey,
      geminiApiKey: user.geminiApiKey,
      geminiModel: user.geminiModel
    });
  } catch (error: any) {
    console.error('Settings PUT Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
