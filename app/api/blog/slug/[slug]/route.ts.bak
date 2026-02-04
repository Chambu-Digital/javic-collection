import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();
    
    let post;
    try {
      post = await BlogPost.findOne({ 
        slug: slug,
        published: true 
      }).populate('relatedProducts');
    } catch (populateError) {
      console.warn('Populate failed, fetching without related products:', populateError);
      post = await BlogPost.findOne({ 
        slug: slug,
        published: true 
      });
    }
    
    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}