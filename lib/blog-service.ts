import connectDB from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'
import { IBlogPost } from '@/models/BlogPost'

export interface BlogQuery {
  page?: number
  limit?: number
  category?: string
  tag?: string
  published?: boolean
  search?: string
}

export interface BlogResponse {
  posts: IBlogPost[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function getBlogPosts(query: BlogQuery = {}): Promise<BlogResponse> {
  await connectDB()
  
  const {
    page = 1,
    limit = 10,
    category,
    tag,
    published,
    search
  } = query
  
  const skip = (page - 1) * limit
  
  // Build query
  const dbQuery: any = {}
  
  if (published !== undefined) {
    dbQuery.published = published
  }
  
  if (category) {
    dbQuery.categories = { $in: [category] }
  }
  
  if (tag) {
    dbQuery.tags = { $in: [tag] }
  }
  
  if (search) {
    dbQuery.$or = [
      { title: { $regex: search, $options: 'i' } },
      { subtitle: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } }
    ]
  }
  
  let posts
  try {
    posts = await BlogPost.find(dbQuery)
      .populate('relatedProducts')
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean() // Convert to plain objects for better performance
  } catch (populateError) {
    console.warn('Populate failed, fetching without related products:', populateError)
    posts = await BlogPost.find(dbQuery)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  }
  
  const total = await BlogPost.countDocuments(dbQuery)
  
  return {
    posts: posts as IBlogPost[],
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

export async function getBlogPostBySlug(slug: string): Promise<IBlogPost | null> {
  await connectDB()
  
  let post
  try {
    post = await BlogPost.findOne({ 
      slug: slug,
      published: true 
    }).populate('relatedProducts').lean()
  } catch (populateError) {
    console.warn('Populate failed, fetching without related products:', populateError)
    post = await BlogPost.findOne({ 
      slug: slug,
      published: true 
    }).lean()
  }
  
  return post as IBlogPost | null
}

export async function getBlogPostById(id: string): Promise<IBlogPost | null> {
  await connectDB()
  
  let post
  try {
    post = await BlogPost.findById(id).populate('relatedProducts').lean()
  } catch (populateError) {
    console.warn('Populate failed, fetching without related products:', populateError)
    post = await BlogPost.findById(id).lean()
  }
  
  return post as IBlogPost | null
}

export async function getRelatedBlogPosts(currentSlug: string, categories: string[], limit: number = 3): Promise<IBlogPost[]> {
  await connectDB()
  
  const posts = await BlogPost.find({
    slug: { $ne: currentSlug },
    published: true,
    categories: { $in: categories }
  })
  .sort({ publishedAt: -1, createdAt: -1 })
  .limit(limit)
  .lean()
  
  return posts as IBlogPost[]
}