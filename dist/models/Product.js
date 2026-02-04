"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const VariantSchema = new mongoose_1.default.Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['size', 'scent', 'color', 'strength', 'custom']
    },
    value: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    wholesalePrice: {
        type: Number,
        min: 0
    },
    wholesaleThreshold: {
        type: Number,
        min: 1
    },
    image: {
        type: String,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    sku: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});
const ProductSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true
    },
    // Variant control
    hasVariants: {
        type: Boolean,
        required: true,
        default: false
    },
    // Simple product fields
    price: {
        type: Number,
        required: function () {
            return !this.hasVariants;
        },
        min: 0,
        default: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    wholesalePrice: {
        type: Number,
        min: 0
    },
    wholesaleThreshold: {
        type: Number,
        min: 1
    },
    images: [{
            type: String
        }],
    // Variant system
    variants: {
        type: [VariantSchema],
        default: []
    },
    category: {
        type: String,
        required: true
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    inStock: {
        type: Boolean,
        default: true
    },
    stockQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviews: {
        type: Number,
        default: 0,
        min: 0
    },
    isNewProduct: {
        type: Boolean,
        default: false
    },
    isBestseller: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isFlashDeal: {
        type: Boolean,
        default: false
    },
    flashDealDiscount: {
        type: Number,
        min: 0,
        max: 100
    },
    ingredients: String,
    usage: String,
    benefits: [String],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Custom validation
ProductSchema.pre('save', function (next) {
    if (this.hasVariants) {
        // Variant products must have at least one variant
        if (!this.variants || this.variants.length === 0) {
            return next(new Error('Products with variants must have at least one variant'));
        }
    }
    else {
        // Simple products must have at least one image and a price > 0
        if (!this.images || this.images.length === 0) {
            return next(new Error('Simple products must have at least one image'));
        }
        if (!this.price || this.price <= 0) {
            return next(new Error('Simple products must have a price greater than 0'));
        }
    }
    next();
});
// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text', category: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isFlashDeal: 1, isActive: 1 });
// Force delete the cached model to ensure we use the new schema
if (mongoose_1.default.models.Product) {
    delete mongoose_1.default.models.Product;
}
exports.default = mongoose_1.default.model('Product', ProductSchema);
