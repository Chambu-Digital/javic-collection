import mongoose from 'mongoose';

export interface IBlogPost {
  _id?: string;
  title: string;
  subtitle?: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  images?: string[];
  author?: string;
  tags: string[];
  categories: string[];
  relatedProducts?: string[];
  published: boolean;
  publishedAt?: Date;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new mongoose.Schema<IBlogPost>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    required: true,
    trim: true
  },
  featuredImage: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  categories: [{
    type: String,
    trim: true
  }],
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  published: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  metaDescription: {
    type: String,
    trim: true
  },
  metaKeywords: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create slug from title if not provided
blogPostSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  // Set publishedAt when publishing
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema);