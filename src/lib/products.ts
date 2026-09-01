import { categories, type Category } from "@/lib/site-config";

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  brand: string;
  price: number;
  image: string;
  description: string;
  stock: number;
  featured: boolean;
};

/**
 * Maps a category's `name` (as used in site-config.ts's `categories` array)
 * to the `category`/`categorySlug`/`image` fields on a Product, so product
 * data can never drift from the site's single category taxonomy.
 */
function findCategory(categoryName: string): Category {
  const category = categories.find((c) => c.name === categoryName);
  if (!category) {
    throw new Error(`products.ts: unknown category "${categoryName}" — check site-config.ts categories`);
  }
  return category;
}

type ProductInput = Omit<Product, "category" | "categorySlug" | "image"> & {
  categoryName: string;
  image?: string;
};

function defineProducts(inputs: ProductInput[]): Product[] {
  return inputs.map(({ categoryName, image, ...rest }) => {
    const category = findCategory(categoryName);
    return {
      ...rest,
      category: category.name,
      categorySlug: category.href.replace(/^\/shop\//, ""),
      image: image ?? category.image,
    };
  });
}

const products: Product[] = defineProducts([
  // Laptops
  {
    id: "p1",
    name: "HP EliteBook 840 G9",
    slug: "hp-elitebook-840-g9",
    categoryName: "Laptops",
    brand: "HP",
    price: 285000,
    description:
      "A business-grade 14\" laptop built for professionals — Intel Core i7, 16GB RAM, 512GB SSD, with enterprise-level security features and all-day battery life.",
    stock: 14,
    featured: false,
  },
  {
    id: "p2",
    name: "Dell XPS 13 9310",
    slug: "dell-xps-13-9310",
    categoryName: "Laptops",
    brand: "Dell",
    price: 320000,
    description:
      "A premium ultrabook with a stunning InfinityEdge display, Intel Core i7 11th Gen, 32GB RAM and 1TB SSD — built for power users who need performance on the go.",
    stock: 9,
    featured: false,
  },
  {
    id: "p3",
    name: "Lenovo ThinkPad X1 Carbon Gen 11",
    slug: "lenovo-thinkpad-x1-carbon-gen-11",
    categoryName: "Laptops",
    brand: "Lenovo",
    price: 375000,
    description:
      "The industry benchmark for business laptops — ultra-lightweight carbon-fiber chassis, Intel Core i7, 16GB RAM and legendary ThinkPad keyboard and durability.",
    stock: 6,
    featured: false,
  },
  {
    id: "p4",
    name: "ASUS ROG Zephyrus G14",
    slug: "asus-rog-zephyrus-g14",
    categoryName: "Laptops",
    brand: "ASUS",
    price: 410000,
    description:
      "A compact powerhouse for gamers and creators — AMD Ryzen 9, NVIDIA RTX 4060, 32GB RAM and a stunning Nebula QHD+ display in a portable 14\" chassis.",
    stock: 5,
    featured: true,
  },

  // Gaming PCs
  {
    id: "p5",
    name: "i.Link Vanguard RTX 4070 Gaming PC",
    slug: "ilink-vanguard-rtx-4070-gaming-pc",
    categoryName: "Gaming PCs",
    brand: "i.Link Custom Build",
    price: 480000,
    description:
      "Custom-built for 1440p gaming — Intel Core i5 14th Gen, NVIDIA GeForce RTX 4070, 32GB DDR5 RAM and 1TB NVMe SSD in a tempered-glass RGB case.",
    stock: 4,
    featured: false,
  },
  {
    id: "p6",
    name: "i.Link Apex RTX 4060 Ti Gaming PC",
    slug: "ilink-apex-rtx-4060-ti-gaming-pc",
    categoryName: "Gaming PCs",
    brand: "i.Link Custom Build",
    price: 350000,
    description:
      "A balanced 1080p/1440p gaming rig — AMD Ryzen 5 7600, NVIDIA GeForce RTX 4060 Ti, 16GB DDR5 RAM and 1TB NVMe SSD.",
    stock: 7,
    featured: false,
  },
  {
    id: "p7",
    name: "i.Link Titan RTX 4080 Super Gaming PC",
    slug: "ilink-titan-rtx-4080-super-gaming-pc",
    categoryName: "Gaming PCs",
    brand: "i.Link Custom Build",
    price: 650000,
    description:
      "Our flagship build for 4K gaming and streaming — Intel Core i7 14th Gen, NVIDIA GeForce RTX 4080 Super, 32GB DDR5 RAM and 2TB NVMe SSD with a 360mm AIO cooler.",
    stock: 2,
    featured: true,
  },

  // All-in-One PCs
  {
    id: "p8",
    name: "HP ProOne 440 G9 All-in-One",
    slug: "hp-proone-440-g9-all-in-one",
    categoryName: "All-in-One PCs",
    brand: "HP",
    price: 195000,
    description:
      "A space-saving 23.8\" All-in-One for the modern office — Intel Core i5, 8GB RAM, 512GB SSD with a built-in webcam and adjustable stand.",
    stock: 11,
    featured: false,
  },
  {
    id: "p9",
    name: "Dell Inspiron 27 All-in-One",
    slug: "dell-inspiron-27-all-in-one",
    categoryName: "All-in-One PCs",
    brand: "Dell",
    price: 220000,
    description:
      "A 27\" QHD All-in-One that combines elegant design with everyday performance — Intel Core i7, 16GB RAM and 512GB SSD.",
    stock: 6,
    featured: false,
  },
  {
    id: "p10",
    name: "Lenovo IdeaCentre AIO 3",
    slug: "lenovo-ideacentre-aio-3",
    categoryName: "All-in-One PCs",
    brand: "Lenovo",
    price: 165000,
    description:
      "A reliable 23.8\" All-in-One for home and study — AMD Ryzen 5, 8GB RAM and 256GB SSD in a slim, clutter-free design.",
    stock: 10,
    featured: false,
  },

  // Monitors
  {
    id: "p11",
    name: "ASUS TUF Gaming VG27AQ 27\" QHD",
    slug: "asus-tuf-gaming-vg27aq-27-qhd",
    categoryName: "Monitors",
    brand: "ASUS",
    price: 78000,
    description:
      "A 27\" QHD IPS gaming monitor with a 165Hz refresh rate, 1ms response time and G-SYNC compatibility for tear-free, fluid gameplay.",
    stock: 15,
    featured: false,
  },
  {
    id: "p12",
    name: "Dell UltraSharp U2723QE 27\" 4K",
    slug: "dell-ultrasharp-u2723qe-27-4k",
    categoryName: "Monitors",
    brand: "Dell",
    price: 145000,
    description:
      "A color-accurate 27\" 4K IPS Black display built for designers and creative professionals, with USB-C hub connectivity and factory calibration.",
    stock: 5,
    featured: true,
  },
  {
    id: "p13",
    name: "LG UltraGear 27GP850",
    slug: "lg-ultragear-27gp850",
    categoryName: "Monitors",
    brand: "LG",
    price: 92000,
    description:
      "A 27\" QHD Nano IPS gaming monitor with a 165Hz refresh rate and HDR400 support for vivid, responsive visuals.",
    stock: 8,
    featured: false,
  },
  {
    id: "p14",
    name: "BenQ PD2705U Designer Monitor",
    slug: "benq-pd2705u-designer-monitor",
    categoryName: "Monitors",
    brand: "BenQ",
    price: 125000,
    description:
      "A 27\" 4K designer monitor with 99% sRGB coverage, hardware calibration and a KVM switch — built for design and engineering workflows.",
    stock: 4,
    featured: false,
  },

  // Networking Products
  {
    id: "p15",
    name: "TP-Link Archer AX73 Wi-Fi 6 Router",
    slug: "tp-link-archer-ax73-wifi-6-router",
    categoryName: "Networking Products",
    brand: "TP-Link",
    price: 32000,
    description:
      "A high-speed Wi-Fi 6 router delivering up to 5400 Mbps across dual bands, ideal for smart homes and small offices with many connected devices.",
    stock: 18,
    featured: false,
  },
  {
    id: "p16",
    name: "Ubiquiti UniFi 6 Long-Range Access Point",
    slug: "ubiquiti-unifi-6-long-range-access-point",
    categoryName: "Networking Products",
    brand: "Ubiquiti",
    price: 48000,
    description:
      "Enterprise-grade Wi-Fi 6 access point with extended range, ideal for offices and venues needing reliable, centrally-managed wireless coverage.",
    stock: 9,
    featured: false,
  },
  {
    id: "p17",
    name: "MikroTik hEX S Router",
    slug: "mikrotik-hex-s-router",
    categoryName: "Networking Products",
    brand: "MikroTik",
    price: 28000,
    description:
      "A compact, powerful gigabit router with advanced routing and firewall features, popular with IT administrators for small business networks.",
    stock: 12,
    featured: false,
  },
  {
    id: "p18",
    name: "Cisco Catalyst 1200 24-Port Switch",
    slug: "cisco-catalyst-1200-24-port-switch",
    categoryName: "Networking Products",
    brand: "Cisco",
    price: 165000,
    description:
      "A managed 24-port gigabit switch with PoE+ support, built for reliable enterprise network infrastructure and simplified management.",
    stock: 3,
    featured: false,
  },

  // CCTV
  {
    id: "p19",
    name: "Hikvision 4MP Turret CCTV Camera",
    slug: "hikvision-4mp-turret-cctv-camera",
    categoryName: "CCTV",
    brand: "Hikvision",
    price: 18500,
    description:
      "A weatherproof 4MP turret camera with night vision up to 30m, ideal for reliable outdoor and indoor surveillance.",
    stock: 22,
    featured: false,
  },
  {
    id: "p20",
    name: "Hikvision ColorVu 4K Bullet Camera",
    slug: "hikvision-colorvu-4k-bullet-camera",
    categoryName: "CCTV",
    brand: "Hikvision",
    price: 32000,
    description:
      "A 4K bullet camera with ColorVu technology for full-color imaging even in low light, ideal for high-detail perimeter security.",
    stock: 10,
    featured: true,
  },
  {
    id: "p21",
    name: "Dahua 8-Channel NVR Kit",
    slug: "dahua-8-channel-nvr-kit",
    categoryName: "CCTV",
    brand: "Dahua",
    price: 95000,
    description:
      "A complete 8-channel NVR surveillance kit with 4 outdoor cameras, 2TB storage and remote mobile viewing — ready for professional installation.",
    stock: 0,
    featured: false,
  },

  // Graphics Cards
  {
    id: "p22",
    name: "ASUS GeForce RTX 4070 Super",
    slug: "asus-geforce-rtx-4070-super",
    categoryName: "Graphics Cards",
    brand: "NVIDIA",
    price: 210000,
    description:
      "A high-performance GPU for 1440p and entry 4K gaming, with DLSS 3 and ray tracing support for the latest AAA titles.",
    stock: 6,
    featured: true,
  },
  {
    id: "p23",
    name: "Gigabyte GeForce RTX 4060 Ti",
    slug: "gigabyte-geforce-rtx-4060-ti",
    categoryName: "Graphics Cards",
    brand: "NVIDIA",
    price: 135000,
    description:
      "A power-efficient 1440p gaming GPU with 16GB VRAM, ideal for high-refresh-rate gaming and light creative workloads.",
    stock: 8,
    featured: false,
  },
  {
    id: "p24",
    name: "ASRock Radeon RX 7800 XT",
    slug: "asrock-radeon-rx-7800-xt",
    categoryName: "Graphics Cards",
    brand: "AMD",
    price: 175000,
    description:
      "A strong 1440p performer with 16GB VRAM, built for gamers who want excellent rasterization performance at a competitive price.",
    stock: 5,
    featured: false,
  },

  // Printers
  {
    id: "p25",
    name: "HP LaserJet Pro M404dn",
    slug: "hp-laserjet-pro-m404dn",
    categoryName: "Printers",
    brand: "HP",
    price: 62000,
    description:
      "A fast, reliable monochrome laser printer with automatic duplex printing, built for busy home offices and small businesses.",
    stock: 13,
    featured: false,
  },
  {
    id: "p26",
    name: "Canon PIXMA G3730 InkTank",
    slug: "canon-pixma-g3730-inktank",
    categoryName: "Printers",
    brand: "Canon",
    price: 38000,
    description:
      "A refillable ink tank all-in-one printer offering ultra-low printing costs, with print, scan and copy in one compact device.",
    stock: 16,
    featured: false,
  },
  {
    id: "p27",
    name: "Epson EcoTank L3250",
    slug: "epson-ecotank-l3250",
    categoryName: "Printers",
    brand: "Epson",
    price: 35000,
    description:
      "A wireless all-in-one EcoTank printer designed for high-volume, low-cost printing at home or in the office.",
    stock: 14,
    featured: false,
  },

  // Storage
  {
    id: "p28",
    name: "Samsung 980 Pro 1TB NVMe SSD",
    slug: "samsung-980-pro-1tb-nvme-ssd",
    categoryName: "Storage",
    brand: "Samsung",
    price: 24500,
    description:
      "A PCIe 4.0 NVMe SSD with read speeds up to 7,000 MB/s, ideal for gaming rigs and performance workstations.",
    stock: 20,
    featured: false,
  },
  {
    id: "p29",
    name: "WD Black SN850X 2TB NVMe SSD",
    slug: "wd-black-sn850x-2tb-nvme-ssd",
    categoryName: "Storage",
    brand: "WD",
    price: 42000,
    description:
      "A high-capacity gaming SSD with PCIe 4.0 speeds and heatsink options, built to eliminate load times in the latest titles.",
    stock: 9,
    featured: true,
  },
  {
    id: "p30",
    name: "Seagate Barracuda 4TB HDD",
    slug: "seagate-barracuda-4tb-hdd",
    categoryName: "Storage",
    brand: "Seagate",
    price: 21000,
    description:
      "A high-capacity 3.5\" hard drive for bulk storage, backups and media libraries at an affordable price per gigabyte.",
    stock: 17,
    featured: false,
  },
  {
    id: "p31",
    name: "Kingston NV2 500GB SSD",
    slug: "kingston-nv2-500gb-ssd",
    categoryName: "Storage",
    brand: "Kingston",
    price: 9500,
    description:
      "An affordable entry-level NVMe SSD offering a significant speed upgrade over traditional hard drives for everyday computing.",
    stock: 25,
    featured: false,
  },

  // RAM
  {
    id: "p32",
    name: "Corsair Vengeance DDR5 32GB (2x16GB)",
    slug: "corsair-vengeance-ddr5-32gb-2x16gb",
    categoryName: "RAM",
    brand: "Corsair",
    price: 28000,
    description:
      "High-performance DDR5 memory kit with tight timings, ideal for the latest gaming and content-creation systems.",
    stock: 12,
    featured: false,
  },
  {
    id: "p33",
    name: "Kingston Fury Beast DDR4 16GB (2x8GB)",
    slug: "kingston-fury-beast-ddr4-16gb-2x8gb",
    categoryName: "RAM",
    brand: "Kingston",
    price: 11500,
    description:
      "Reliable DDR4 memory with low-profile heat spreaders, a popular choice for gaming builds and everyday workstations.",
    stock: 19,
    featured: false,
  },
  {
    id: "p34",
    name: "Corsair Dominator Platinum DDR5 64GB",
    slug: "corsair-dominator-platinum-ddr5-64gb",
    categoryName: "RAM",
    brand: "Corsair",
    price: 58000,
    description:
      "A premium high-capacity DDR5 kit with striking RGB lighting, built for demanding workstation and creator workloads.",
    stock: 4,
    featured: false,
  },

  // Mouse
  {
    id: "p35",
    name: "Logitech G502 Hero Gaming Mouse",
    slug: "logitech-g502-hero-gaming-mouse",
    categoryName: "Mouse",
    brand: "Logitech",
    price: 12500,
    description:
      "A legendary gaming mouse with a 25,600 DPI HERO sensor and 11 programmable buttons, trusted by competitive gamers worldwide.",
    stock: 21,
    featured: false,
  },
  {
    id: "p36",
    name: "Razer DeathAdder V3",
    slug: "razer-deathadder-v3",
    categoryName: "Mouse",
    brand: "Razer",
    price: 15000,
    description:
      "An ergonomic esports mouse with a lightweight design and a Focus Pro 30K sensor for precise, fast-paced gameplay.",
    stock: 15,
    featured: false,
  },
  {
    id: "p37",
    name: "Logitech MX Master 3S",
    slug: "logitech-mx-master-3s",
    categoryName: "Mouse",
    brand: "Logitech",
    price: 24000,
    description:
      "A premium productivity mouse with an 8K DPI sensor, quiet clicks and MagSpeed scrolling, built for professionals.",
    stock: 11,
    featured: true,
  },

  // Keyboard
  {
    id: "p38",
    name: "Corsair K70 RGB Pro Mechanical Keyboard",
    slug: "corsair-k70-rgb-pro-mechanical-keyboard",
    categoryName: "Keyboard",
    brand: "Corsair",
    price: 32000,
    description:
      "A tournament-grade mechanical keyboard with Cherry MX switches, per-key RGB lighting and a durable aluminum frame.",
    stock: 8,
    featured: false,
  },
  {
    id: "p39",
    name: "Logitech MX Keys",
    slug: "logitech-mx-keys",
    categoryName: "Keyboard",
    brand: "Logitech",
    price: 22000,
    description:
      "A wireless productivity keyboard with smart illumination and stable, comfortable typing across multiple connected devices.",
    stock: 13,
    featured: false,
  },
  {
    id: "p40",
    name: "Razer BlackWidow V4",
    slug: "razer-blackwidow-v4",
    categoryName: "Keyboard",
    brand: "Razer",
    price: 28500,
    description:
      "A full-size mechanical gaming keyboard with dedicated media controls, a magnetic wrist rest and vivid Chroma RGB.",
    stock: 7,
    featured: false,
  },

  // Headphones
  {
    id: "p41",
    name: "HyperX Cloud II Gaming Headset",
    slug: "hyperx-cloud-ii-gaming-headset",
    categoryName: "Headphones",
    brand: "HyperX",
    price: 16500,
    description:
      "A best-selling gaming headset with virtual 7.1 surround sound and memory foam ear cushions for all-day comfort.",
    stock: 16,
    featured: false,
  },
  {
    id: "p42",
    name: "Logitech G Pro X Wireless",
    slug: "logitech-g-pro-x-wireless",
    categoryName: "Headphones",
    brand: "Logitech",
    price: 29000,
    description:
      "An esports-grade wireless headset with Blue VO!CE microphone technology and up to 20 hours of battery life.",
    stock: 9,
    featured: false,
  },
  {
    id: "p43",
    name: "Razer BlackShark V2 Pro",
    slug: "razer-blackshark-v2-pro",
    categoryName: "Headphones",
    brand: "Razer",
    price: 34000,
    description:
      "A lightweight wireless esports headset with THX Spatial Audio and Razer's signature clear-cast supercardioid microphone.",
    stock: 6,
    featured: false,
  },

  // Gaming PC Cases
  {
    id: "p44",
    name: "Cooler Master MasterBox TD500 Mesh",
    slug: "cooler-master-masterbox-td500-mesh",
    categoryName: "Gaming PC Cases",
    brand: "Cooler Master",
    price: 24500,
    description:
      "A high-airflow mid-tower case with a polygonal mesh front panel and pre-installed ARGB fans, built for thermal performance.",
    stock: 10,
    featured: false,
  },
  {
    id: "p45",
    name: "NZXT H5 Flow",
    slug: "nzxt-h5-flow",
    categoryName: "Gaming PC Cases",
    brand: "NZXT",
    price: 21000,
    description:
      "A clean, minimalist mid-tower case with optimized airflow and cable management, ideal for a tidy, high-performance build.",
    stock: 12,
    featured: false,
  },
  {
    id: "p46",
    name: "Corsair 4000D Airflow",
    slug: "corsair-4000d-airflow",
    categoryName: "Gaming PC Cases",
    brand: "Corsair",
    price: 26500,
    description:
      "One of the most popular airflow-focused mid-tower cases, with generous radiator support and tool-free drive mounting.",
    stock: 8,
    featured: false,
  },

  // Power Supplies
  {
    id: "p47",
    name: "Corsair RM850x 850W 80+ Gold",
    slug: "corsair-rm850x-850w-80-gold",
    categoryName: "Power Supplies",
    brand: "Corsair",
    price: 32000,
    description:
      "A fully modular 850W power supply with 80 PLUS Gold efficiency and a zero-RPM fan mode for near-silent operation.",
    stock: 11,
    featured: false,
  },
  {
    id: "p48",
    name: "Cooler Master MWE 650W Bronze",
    slug: "cooler-master-mwe-650w-bronze",
    categoryName: "Power Supplies",
    brand: "Cooler Master",
    price: 15500,
    description:
      "A dependable 650W 80 PLUS Bronze power supply, offering safe and stable power delivery for everyday builds.",
    stock: 18,
    featured: false,
  },
]);

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
