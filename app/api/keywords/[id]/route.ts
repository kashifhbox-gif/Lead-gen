import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/app/lib/db';
import KeywordCategory from '@/app/models/KeywordCategory';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { name, keywords } = body;

    const category = await KeywordCategory.findByIdAndUpdate(
      id,
      { $set: { name, keywords } },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Failed to update keyword category:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const category = await KeywordCategory.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete keyword category:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
