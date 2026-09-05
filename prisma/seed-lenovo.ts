import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import crypto from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function deterministicSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const lenovoLaptops = [
  {
    name: "LENOVO THINKPAD T480 | Cii5 8th Gen | 8GB RAM | 256GB SSD | 14\" LED | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad T480\nProcessor: Intel Core i5, 8th Gen Generation\nMemory (RAM): 8GB RAM\nStorage: 256GB SSD\nDisplay: 14\" LED\nAccessories: Original Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad T480. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i5 (8th Gen Generation), 8GB RAM, and a lightning-fast 256GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 14" LED, the Lenovo Thinkpad T480 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i5 8th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 8GB RAM combined with 256GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad T480 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad T480", "Intel Core i5 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 54000,
    seoTitle: "Lenovo Thinkpad T480 Cii5 8th Gen (8GB RAM, 256GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad T480 featuring Intel Core i5 8th Gen Gen, 8GB RAM, 256GB SSD, and 14\" LED. 100% verified condition with original charger included. Order ..."
  },
  {
    name: "LENOVO THINKPAD T14 GEN 1 | Cii5 10th Gen | 16GB RAM | 512GB SSD | 14\" LED Touchscreen | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad T14 Gen 1\nProcessor: Intel Core i5, 10th Gen Generation\nMemory (RAM): 16GB RAM\nStorage: 512GB SSD\nDisplay: 14\" LED Touchscreen\nGraphics / Features: Type-C Fast Charger\nAccessories: Original 65W Type-C Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad T14 Gen 1. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i5 (10th Gen Generation), 16GB RAM, and a lightning-fast 512GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 14" LED Touchscreen with Type-C Fast Charger, the Lenovo Thinkpad T14 Gen 1 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i5 10th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 16GB RAM combined with 512GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original 65w type-c charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad T14 Gen 1 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad T14 Gen 1", "Intel Core i5 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 78000,
    seoTitle: "Lenovo Thinkpad T14 Gen 1 Cii5 10th Gen (16GB RAM, 512GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad T14 Gen 1 featuring Intel Core i5 10th Gen Gen, 16GB RAM, 512GB SSD, and 14\" LED Touchscreen. 100% verified condition with original charg..."
  },
  {
    name: "LENOVO THINKPAD YOGA L390 | Cii5 8th Gen | 8GB RAM | 256GB SSD | 13.3\" LED Touch x360 2-in-1 | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad Yoga L390\nProcessor: Intel Core i5, 8th Gen Generation\nMemory (RAM): 8GB RAM\nStorage: 256GB SSD\nDisplay: 13.3\" LED Touch x360 2-in-1\nGraphics / Features: 360-degree Convertible Hinge\nAccessories: Original Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad Yoga L390. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i5 (8th Gen Generation), 8GB RAM, and a lightning-fast 256GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 13.3" LED Touch x360 2-in-1 with 360-degree Convertible Hinge, the Lenovo Thinkpad Yoga L390 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i5 8th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 8GB RAM combined with 256GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad Yoga L390 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad Yoga L390", "Intel Core i5 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 59000,
    seoTitle: "Lenovo Thinkpad Yoga L390 Cii5 8th Gen (8GB RAM, 256GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad Yoga L390 featuring Intel Core i5 8th Gen Gen, 8GB RAM, 256GB SSD, and 13.3\" LED Touch x360 2-in-1. 100% verified condition with original..."
  },
  {
    name: "LENOVO THINKPAD P15S GEN 2 | Cii7 11th Gen | 16GB RAM | 256GB SSD | 15.6\" LED Display | 4GB Dedicated GPU | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad P15S Gen 2\nProcessor: Intel Core i7, 11th Gen Generation\nMemory (RAM): 16GB RAM\nStorage: 256GB SSD\nDisplay: 15.6\" LED Display\nGraphics / Features: 4GB Dedicated Graphics (GC) & Type-C\nAccessories: Original Type-C Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad P15S Gen 2. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i7 (11th Gen Generation), 16GB RAM, and a lightning-fast 256GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 15.6" LED Display with 4GB Dedicated Graphics (GC) & Type-C, the Lenovo Thinkpad P15S Gen 2 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i7 11th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 16GB RAM combined with 256GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original type-c charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad P15S Gen 2 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad P15S Gen 2", "Intel Core i7 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 140000,
    seoTitle: "Lenovo Thinkpad P15S Gen 2 Cii7 11th Gen (16GB RAM, 256GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad P15S Gen 2 featuring Intel Core i7 11th Gen Gen, 16GB RAM, 256GB SSD, and 15.6\" LED Display. 100% verified condition with original charge..."
  },
  {
    name: "LENOVO THINKPAD L490 | Cii5 8th Gen | 8GB RAM | 256GB SSD | 14\" LED | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad L490\nProcessor: Intel Core i5, 8th Gen Generation\nMemory (RAM): 8GB RAM\nStorage: 256GB SSD\nDisplay: 14\" LED\nAccessories: Original Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad L490. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i5 (8th Gen Generation), 8GB RAM, and a lightning-fast 256GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 14" LED, the Lenovo Thinkpad L490 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i5 8th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 8GB RAM combined with 256GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad L490 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad L490", "Intel Core i5 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 48000,
    seoTitle: "Lenovo Thinkpad L490 Cii5 8th Gen (8GB RAM, 256GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad L490 featuring Intel Core i5 8th Gen Gen, 8GB RAM, 256GB SSD, and 14\" LED. 100% verified condition with original charger included. Order ..."
  },
  {
    name: "LENOVO THINKPAD T14 | Cii7 10th Gen | 16GB RAM | 512GB SSD | 14\" LED | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad T14\nProcessor: Intel Core i7, 10th Gen Generation\nMemory (RAM): 16GB RAM\nStorage: 512GB SSD\nDisplay: 14\" LED\nAccessories: Original Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad T14. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i7 (10th Gen Generation), 16GB RAM, and a lightning-fast 512GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 14" LED, the Lenovo Thinkpad T14 guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i7 10th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 16GB RAM combined with 512GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad T14 today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad T14", "Intel Core i7 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 80000,
    seoTitle: "Lenovo Thinkpad T14 Cii7 10th Gen (16GB RAM, 512GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad T14 featuring Intel Core i7 10th Gen Gen, 16GB RAM, 512GB SSD, and 14\" LED. 100% verified condition with original charger included. Order..."
  },
  {
    name: "LENOVO THINKPAD T14S | Cii7 11th Gen | 16GB RAM | 512GB SSD | 14\" LED Slim Ultrabook | Charger Included",
    shortDescription: "Key Specifications\nBrand / Model: Lenovo Thinkpad T14S\nProcessor: Intel Core i7, 11th Gen Generation\nMemory (RAM): 16GB RAM\nStorage: 512GB SSD\nDisplay: 14\" LED Slim Ultrabook\nGraphics / Features: Slim Lightweight Chassis\nAccessories: Original Charger Included\nCondition: Tested and ready to use",
    fullDescription: `<p>Boost your daily workflow and professional productivity with the robust Lenovo Thinkpad T14S. Built to enterprise military-grade durability standards, this machine is equipped with a high-performance Intel Core i7 (11th Gen Generation), 16GB RAM, and a lightning-fast 512GB SSD for instantaneous boot times and effortless multitasking across demanding business applications.</p>
<p>Featuring an anti-glare 14" LED Slim Ultrabook with Slim Lightweight Chassis, the Lenovo Thinkpad T14S guarantees crisp, vivid clarity and comfortable screen time during extended workdays. Renowned for its industry-leading ergonomic ThinkPad keyboard, exceptional thermal efficiency, and long-lasting battery stamina, it delivers uncompromised reliability whether in the office or on the move.</p>
<p><strong>Key Highlights:</strong></p>
<ul>
<li><strong>Reliable Processing:</strong> Powered by Intel Core i7 11th Gen Gen for snappy execution and fluid productivity.</li>
<li><strong>High-Speed Performance:</strong> 16GB RAM combined with 512GB SSD ensures lag-free workflows and quick file transfers.</li>
<li><strong>Built Tough:</strong> Iconic ThinkPad structural durability tested against everyday bumps and travel wear.</li>
<li><strong>Complete Package:</strong> Fully tested, quality certified, and packaged with original charger included.</li>
</ul>
<p>Order the Lenovo Thinkpad T14S today at the best market price with secure nationwide delivery.</p>`,
    tags: ["Lenovo Laptops", "Lenovo Thinkpad T14S", "Intel Core i7 Laptop", "ThinkPad", "Business Laptop", "Used Laptops"],
    category: "Laptops",
    brand: "Lenovo",
    price: 60000,
    seoTitle: "Lenovo Thinkpad T14S Cii7 11th Gen (16GB RAM, 512GB SSD) - Best Price",
    seoDescription: "Buy Lenovo Thinkpad T14S featuring Intel Core i7 11th Gen Gen, 16GB RAM, 512GB SSD, and 14\" LED Slim Ultrabook. 100% verified condition with original charger..."
  }
];

async function main() {
  console.log("Seeding Lenovo laptops...");

  // Ensure category exists
  const categorySlug = deterministicSlug(lenovoLaptops[0].category);
  const categoryRow = await db.category.upsert({
    where: { slug: categorySlug },
    create: {
      name: lenovoLaptops[0].category,
      slug: categorySlug,
      tier: "SECONDARY",
      sortOrder: 100
    },
    update: {}
  });

  // Ensure brand exists
  const brandSlug = deterministicSlug(lenovoLaptops[0].brand);
  const brandRow = await db.brand.upsert({
    where: { slug: brandSlug },
    create: {
      name: lenovoLaptops[0].brand,
      slug: brandSlug,
      logoUrl: "/brands/" + brandSlug + ".svg"
    },
    update: {}
  });

  let createdCount = 0;

  for (const item of lenovoLaptops) {
    const slug = deterministicSlug(item.name.split("|")[0].trim());
    const id = "p_" + crypto.randomBytes(4).toString("hex"); // Generate unique ID
    
    await db.product.upsert({
      where: { slug },
      create: {
        id,
        name: item.name,
        slug,
        description: item.fullDescription,
        shortDescription: item.shortDescription,
        price: item.price,
        stock: 10,
        status: "ACTIVE",
        categoryId: categoryRow.id,
        brandId: brandRow.id,
        tags: item.tags,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
      },
      update: {
        name: item.name,
        description: item.fullDescription,
        shortDescription: item.shortDescription,
        price: item.price,
        categoryId: categoryRow.id,
        brandId: brandRow.id,
        tags: item.tags,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
      }
    });
    createdCount++;
  }

  console.log("Successfully seeded " + createdCount + " Lenovo laptops.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
