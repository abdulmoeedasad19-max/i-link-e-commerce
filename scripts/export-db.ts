import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as fs from 'fs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function exportData() {
  // List of all Prisma models in camelCase format
  const models = [
    'user',
    'account',
    'session',
    'verificationToken',
    'address',
    'cartItem',
    'wishlistItem',
    'order',
    'orderItem',
    'category',
    'brand',
    'product',
    'productRedirect',
    'productImage',
    'quotation',
    'coupon',
    'loginAttempt',
    'review',
    'activityLog',
    'storeSettings',
    'contactMessage',
    'newsletterSubscriber',
    'banner',
    'returnRequest',
    'rateLimitWindow'
  ];

  const data: any = {};
  for (const model of models) {
    // @ts-ignore
    if (prisma[model]) {
      console.log(`Exporting ${model}...`);
      // @ts-ignore
      data[model] = await prisma[model].findMany();
    }
  }

  fs.writeFileSync('db-export.json', JSON.stringify(data, null, 2));
  console.log("Export complete! Saved to db-export.json");
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
