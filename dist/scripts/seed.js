"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const seed_1 = require("../lib/seed");
async function runSeed() {
    try {
        console.log('🌱 Starting database seed...');
        const result = await (0, seed_1.seedDatabase)();
        console.log('✅ Seed completed successfully!');
        console.log(`📊 Results: ${result.categories} categories, ${result.products} products`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
}
runSeed();
