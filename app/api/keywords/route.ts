import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import KeywordCategory from '@/app/models/KeywordCategory';

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await KeywordCategory.find().sort({ name: 1 });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Failed to fetch keyword categories:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await KeywordCategory.create({
      name: body.name,
      keywords: body.keywords || []
    });

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Failed to create keyword category:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}
