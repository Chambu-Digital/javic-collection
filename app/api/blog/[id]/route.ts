import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Blog [id] route called with ID:', id);
    await connectDB();
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId:', id);
      return NextResponse.json(
        { error: 'Invalid blog post ID' },
        { status: 400 }
      );
    }
    
    let post;
    try {
      post = await BlogPost.findById(id).populate('relatedProducts');
    } catch (populateError) {
      console.warn('Populate failed, fetching without related products:', populateError);
      post = await BlogPost.findById(id);
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const data = await request.json();
    
    let post;
    try {
      post = await BlogPost.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      ).populate('relatedProducts');
    } catch (populateError) {
      console.warn('Populate failed, updating without related products:', populateError);
      post = await BlogPost.findByIdAndUpdate(
        id,
        data,
        { new: true, runValidators: true }
      );
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    
    const post = await BlogPost.findByIdAndDelete(id);
    
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}