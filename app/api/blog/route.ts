import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const published = searchParams.get('published');
    const search = searchParams.get('search');
    
    const skip = (page - 1) * limit;
    
    // Build query
    const query: any = {};
    
    if (published) {
      query.published = published === 'true';
    }
    
    if (category) {
      query.categories = { $in: [category] };
    }
    
    if (tag) {
      query.tags = { $in: [tag] };
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subtitle: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    let posts;
    try {
      posts = await BlogPost.find(query)
        .populate('relatedProducts')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    } catch (populateError) {
      // If populate fails, fetch without populate
      console.warn('Populate failed, fetching without related products:', populateError);
      posts = await BlogPost.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }
    
    const total = await BlogPost.countDocuments(query);
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const data = await request.json();
    
    const post = new BlogPost(data);
    await post.save();
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    );
  }
}
