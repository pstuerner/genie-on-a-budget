import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { ParquetReader } from "@dsnp/parquetjs";
import postgres from "postgres";
import { products, reviews } from "../lib/db/schema";
import fs from "node:fs";
import path from "node:path";

config({
  path: ".env",
});

interface ParquetRow {
  rating: number;
  title_x: string;
  text: string;
  images_x: string;
  asin: string;
  parent_asin: string;
  user_id: string;
  timestamp: string;
  helpful_vote: number;
  verified_purchase: boolean;
  "Unnamed: 0": number;
  main_category: string;
  title_y: string;
  average_rating: number;
  rating_number: number;
  features: string;
  description: string;
  price: string;
  images_y: string;
  videos: string;
  store: string;
}

function parseJsonSafe(value: any): any {
  // If it's already null or undefined
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's already an object or array, return it as-is
  if (typeof value === "object") {
    // Check if it's an empty array or object
    if (Array.isArray(value) && value.length === 0) {
      return null;
    }
    if (typeof value === "object" && Object.keys(value).length === 0) {
      return null;
    }
    return value;
  }
  
  // If it's a string, try to parse it
  if (typeof value === "string") {
    if (value === "" || value === "null" || value === "[]" || value === "{}") {
      return null;
    }
    try {
      const parsed = JSON.parse(value);
      // Check if parsed result is empty
      if (Array.isArray(parsed) && parsed.length === 0) {
        return null;
      }
      if (typeof parsed === "object" && Object.keys(parsed).length === 0) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  
  return null;
}

// Special handler for nested array fields from Parquet
// Many fields come as [[data]] or ['data'] and need unwrapping
function unwrapNestedArray(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }
  
  // If it's an array with a single element that's also an array, unwrap it
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return null;
    }
    // If the array has one element and it's an array, return the inner array
    if (value.length === 1 && Array.isArray(value[0])) {
      return value[0].length > 0 ? value[0] : null;
    }
    // If the array has one element and it's a string, return the string
    if (value.length === 1 && typeof value[0] === "string") {
      return value[0] || null;
    }
    // Otherwise return the array as-is
    return value;
  }
  
  return value;
}

function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr || priceStr === "" || priceStr === "null") {
    return null;
  }
  // Remove currency symbols and commas, then parse
  const cleaned = priceStr.replace(/[$,]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseTimestamp(timestampStr: string | null | undefined): Date | null {
  if (!timestampStr || timestampStr === "" || timestampStr === "null") {
    return null;
  }
  try {
    // Handle Unix timestamp (in milliseconds)
    const timestamp = Number.parseInt(timestampStr, 10);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp);
    }
    // Try parsing as ISO string
    return new Date(timestampStr);
  } catch {
    return null;
  }
}

async function importParquetData(filePath: string, batchSize = 1000) {
  if (!process.env.POSTGRES_URL) {
    throw new Error("POSTGRES_URL not defined");
  }

  console.log(`📦 Opening Parquet file: ${filePath}`);
  
  const reader = await ParquetReader.openFile(filePath);
  const cursor = reader.getCursor();
  
  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  let row: ParquetRow | null = null;
  let rowCount = 0;
  let productCount = 0;
  let reviewCount = 0;
  let errorCount = 0;
  let variantsSkipped = 0;

  // Track unique parent ASINs to avoid duplicate inserts
  // Key: parentAsin, Value: first variant asin seen
  const seenParentAsins = new Map<string, string>();
  const productBatch: Array<typeof products.$inferInsert> = [];
  const reviewBatch: Array<typeof reviews.$inferInsert> = [];

  console.log("⏳ Processing rows and collecting data...");

  try {
    // First pass: collect all data
    while ((row = await cursor.next() as ParquetRow | null)) {
      rowCount++;

      try {
        // Debug: Log first row to see data structure
        if (rowCount === 1) {
          console.log("\n🔍 Sample data from first row:");
          console.log("  Raw images_y:", JSON.stringify(row.images_y)?.substring(0, 200));
          console.log("  Unwrapped images_y:", JSON.stringify(unwrapNestedArray(row.images_y))?.substring(0, 200));
          console.log("  Raw features:", JSON.stringify(row.features)?.substring(0, 200));
          console.log("  Unwrapped features:", JSON.stringify(unwrapNestedArray(row.features))?.substring(0, 200));
          console.log("  Raw description:", JSON.stringify(row.description)?.substring(0, 200));
          console.log("  Unwrapped description:", JSON.stringify(unwrapNestedArray(row.description))?.substring(0, 200));
          console.log("");
        }

        // Extract and transform product data
        const asin = row.asin?.trim();
        if (!asin) {
          console.warn(`⚠️  Row ${rowCount}: Missing ASIN, skipping`);
          errorCount++;
          continue;
        }

        // Determine the parent ASIN (use asin itself if parent_asin is null)
        const parentAsin = row.parent_asin?.trim() || asin;

        // Process product (only if this parent ASIN hasn't been seen)
        if (!seenParentAsins.has(parentAsin)) {
          seenParentAsins.set(parentAsin, asin);

          // Unwrap nested arrays for Parquet data structure
          const featuresRaw = unwrapNestedArray(row.features);
          const descriptionRaw = unwrapNestedArray(row.description);
          const imagesRaw = unwrapNestedArray(row.images_y);
          const videosRaw = unwrapNestedArray(row.videos);

          const priceValue = parsePrice(row.price);
          const ratingValue = row.average_rating ? Number(row.average_rating) : null;
          
          productBatch.push({
            parentAsin,
            asin,
            title: row.title_y?.trim() || null,
            store: row.store?.trim() || null,
            price: priceValue !== null ? priceValue.toString() : null,
            averageRating: ratingValue !== null ? ratingValue.toString() : null,
            ratingNumber: row.rating_number || null,
            description: descriptionRaw,
            features: featuresRaw,
            images: imagesRaw,
            videos: videosRaw,
          });
        } else {
          variantsSkipped++;
        }

        // Process review - link to parent ASIN but keep original variant ASIN
        const reviewImagesRaw = unwrapNestedArray(row.images_x);
        
        reviewBatch.push({
          parentAsin,
          asin,
          userId: row.user_id?.trim() || null,
          verifiedPurchase: row.verified_purchase ?? null,
          helpfulVote: row.helpful_vote || null,
          rating: row.rating || null,
          reviewTitle: row.title_x?.trim() || null,
          reviewText: row.text?.trim() || null,
          images: reviewImagesRaw,
          reviewTimestamp: parseTimestamp(row.timestamp),
          sourceRowId: row["Unnamed: 0"] || null,
        });

        if (rowCount % 10000 === 0) {
          console.log(`  📊 Processed ${rowCount} rows...`);
        }
      } catch (err) {
        errorCount++;
        console.error(`❌ Error processing row ${rowCount}:`, err);
        if (errorCount > 100) {
          throw new Error("Too many errors, aborting import");
        }
      }
    }

    console.log(`\n✅ Finished reading ${rowCount} rows`);
    console.log(`   - Unique parent ASINs (products): ${productBatch.length}`);
    console.log(`   - Product variants skipped: ${variantsSkipped}`);
    console.log(`   - Total reviews: ${reviewBatch.length}`);

    // Insert all products first
    console.log("\n⏳ Inserting products...");
    for (let i = 0; i < productBatch.length; i += batchSize) {
      const batch = productBatch.slice(i, i + batchSize);
      await db.insert(products)
        .values(batch)
        .onConflictDoNothing();
      productCount += batch.length;
      console.log(`  ✓ Inserted ${productCount}/${productBatch.length} products`);
    }

    // Then insert all reviews
    console.log("\n⏳ Inserting reviews...");
    for (let i = 0; i < reviewBatch.length; i += batchSize) {
      const batch = reviewBatch.slice(i, i + batchSize);
      try {
        await db.insert(reviews)
          .values(batch)
          .onConflictDoNothing();
        reviewCount += batch.length;
        console.log(`  ✓ Inserted ${reviewCount}/${reviewBatch.length} reviews`);
      } catch (err) {
        console.error(`❌ Error inserting review batch ${i}-${i + batch.length}:`, err);
        errorCount += batch.length;
      }
    }

    console.log("\n✅ Import completed successfully!");
    console.log(`📊 Statistics:`);
    console.log(`   - Total rows processed: ${rowCount}`);
    console.log(`   - Products inserted: ${productCount}`);
    console.log(`   - Product variants skipped: ${variantsSkipped}`);
    console.log(`   - Reviews inserted: ${reviewCount}`);
    console.log(`   - Errors encountered: ${errorCount}`);

  } catch (err) {
    console.error("❌ Import failed:", err);
    throw err;
  } finally {
    await reader.close();
    await connection.end();
  }
}

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const filePath = args[0] || "./data/train-00000-of-00003.parquet";
  const batchSize = args[1] ? Number.parseInt(args[1], 10) : 1000;

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log("\nUsage: tsx scripts/import-parquet.ts [file-path] [batch-size]");
    console.log("  file-path: Path to the Parquet file (default: ./data/train-00000-of-00003.parquet)");
    console.log("  batch-size: Number of rows per batch insert (default: 1000)");
    process.exit(1);
  }

  console.log("🚀 Starting Parquet data import...");
  console.log(`   File: ${filePath}`);
  console.log(`   Batch size: ${batchSize}\n`);

  try {
    await importParquetData(filePath, batchSize);
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  }
};

main();
