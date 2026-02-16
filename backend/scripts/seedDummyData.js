require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

const DUMMY_CATEGORY_SEEDS = [
    {
        name: 'Elektronik',
        slug: 'elektronik',
        description: 'Kategori elektronik dummy',
        sort_order: 1,
    },
    {
        name: 'Fashion',
        slug: 'fashion',
        description: 'Kategori fashion dummy',
        sort_order: 2,
    },
    {
        name: 'Rumah Tangga',
        slug: 'rumah-tangga',
        description: 'Kategori rumah tangga dummy',
        sort_order: 3,
    },
    {
        name: 'Kesehatan',
        slug: 'kesehatan',
        description: 'Kategori kesehatan dummy',
        sort_order: 4,
    },
    {
        name: 'Olahraga',
        slug: 'olahraga',
        description: 'Kategori olahraga dummy',
        sort_order: 5,
    },
];

const BRANDS = ['Aster', 'Nexa', 'Velora', 'Kairo', 'Lumina', 'Orion'];
const TAGS = ['promo', 'baru', 'favorit', 'hemat', 'unggulan', 'terlaris'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const pickRandom = (arr) => arr[randomInt(0, arr.length - 1)];

const buildProductPayload = ({ index, categoryId, seedKey }) => {
    const running = String(index + 1).padStart(3, '0');
    const basePrice = randomInt(50000, 950000);
    const discount = randomInt(5000, 80000);
    const comparePrice = basePrice + discount;
    const stock = randomInt(5, 200);
    const ratingCount = randomInt(0, 500);
    const ratingAvg = ratingCount === 0 ? 0 : Number((Math.random() * 2 + 3).toFixed(2));
    const soldCount = randomInt(0, 1200);

    return {
        name: `Produk Dummy ${running}`,
        slug: `produk-dummy-${running}-${seedKey}`,
        description: `Ini adalah deskripsi produk dummy ke-${running} untuk kebutuhan development/testing.`,
        short_description: `Produk dummy ${running}`,
        price: basePrice,
        compare_price: comparePrice,
        cost_price: Math.max(1000, basePrice - randomInt(2000, 15000)),
        sku: `DUMMY-${running}-${seedKey}`,
        barcode: `${seedKey}${String(randomInt(1000000, 9999999))}`,
        stock,
        low_stock_threshold: 5,
        weight: Number((Math.random() * 4.5 + 0.3).toFixed(2)),
        category_id: categoryId,
        brand: pickRandom(BRANDS),
        tags: [pickRandom(TAGS), pickRandom(TAGS)],
        is_active: true,
        is_featured: index % 10 === 0,
        rating_avg: ratingAvg,
        rating_count: ratingCount,
        sold_count: soldCount,
    };
};

const ensureCategories = async () => {
    const { error: upsertError } = await supabaseAdmin
        .from('categories')
        .upsert(DUMMY_CATEGORY_SEEDS, { onConflict: 'slug' });

    if (upsertError) {
        throw upsertError;
    }

    const { data: categories, error: fetchError } = await supabaseAdmin
        .from('categories')
        .select('id, name, slug')
        .in('slug', DUMMY_CATEGORY_SEEDS.map((item) => item.slug));

    if (fetchError) {
        throw fetchError;
    }

    return categories || [];
};

const insertProductsInBatches = async ({ total, categories, seedKey }) => {
    const chunkSize = 20;
    const insertedProducts = [];

    for (let start = 0; start < total; start += chunkSize) {
        const end = Math.min(start + chunkSize, total);
        const payload = [];

        for (let i = start; i < end; i += 1) {
            const category = categories[i % categories.length];
            payload.push(
                buildProductPayload({
                    index: i,
                    categoryId: category.id,
                    seedKey,
                })
            );
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .insert(payload)
            .select('id, name');

        if (error) {
            throw error;
        }

        insertedProducts.push(...(data || []));
        console.log(`Inserted ${insertedProducts.length}/${total} products`);
    }

    return insertedProducts;
};

const insertPrimaryImages = async (products, seedKey) => {
    if (!products.length) return;

    const imageRows = products.map((product, idx) => ({
        product_id: product.id,
        url: `https://picsum.photos/seed/tumbal-${seedKey}-${idx + 1}/800/800`,
        alt_text: product.name,
        sort_order: 0,
        is_primary: true,
    }));

    const { error } = await supabaseAdmin.from('product_images').insert(imageRows);

    if (error) {
        throw error;
    }
};

const main = async () => {
    const totalDummyProducts = 100;
    const seedKey = Date.now().toString().slice(-6);

    console.log('Starting dummy data seeding...');

    const categories = await ensureCategories();
    if (!categories.length) {
        throw new Error('No categories available for seeding products');
    }

    console.log(`Using ${categories.length} categories`);

    const products = await insertProductsInBatches({
        total: totalDummyProducts,
        categories,
        seedKey,
    });

    await insertPrimaryImages(products, seedKey);

    console.log(`✅ Done. Inserted ${products.length} dummy products with primary images.`);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Failed to seed dummy data:', error.message || error);
        process.exit(1);
    });
