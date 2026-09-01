import { CategoryType, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

process.loadEnvFile?.();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🧹 Vaciando completamente la base de datos...');

  // 1. Limpieza total de tablas relacionales (orden respetando dependencias de clave foránea)
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.orderDelivery.deleteMany();
  await prisma.orderMilestone.deleteMany();
  await prisma.orderDispute.deleteMany();
  await prisma.order.deleteMany();
  await prisma.quoteProposal.deleteMany();
  await prisma.leadUnlock.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.gigExtra.deleteMany();
  await prisma.gigPackage.deleteMany();
  await prisma.gig.deleteMany();
  await prisma.portfolioItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.ledgerTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  console.log('✨ Base de datos completamente limpia (0 usuarios, 0 pedidos, 0 servicios)');

  // 2. Crear exclusivamente las Categorías Oficiales por Defecto
  const categoriesData = [
    {
      name: 'Electricidad',
      slug: 'electricidad',
      description: 'Instalaciones eléctricas, cuadros, boletines y averías',
      icon: 'zap',
      sortOrder: 1,
      baseLeadCreditCost: 12,
    },
    {
      name: 'Fontanería',
      slug: 'fontaneria',
      description: 'Fugas de agua, calderas, grifería y desatascos',
      icon: 'droplets',
      sortOrder: 2,
      baseLeadCreditCost: 12,
    },
    {
      name: 'Baños',
      slug: 'banos',
      description: 'Cambio de bañera por plato, mamparas y sanitarios',
      icon: 'bath',
      sortOrder: 3,
      baseLeadCreditCost: 15,
    },
    {
      name: 'Cocina',
      slug: 'cocina',
      description: 'Muebles a medida, encimeras e instalaciones completas',
      icon: 'utensils',
      sortOrder: 4,
      baseLeadCreditCost: 15,
    },
    {
      name: 'Pladur',
      slug: 'pladur',
      description: 'Tabiquería seca, techos continuos e insonorización acústica',
      icon: 'square',
      sortOrder: 5,
      baseLeadCreditCost: 14,
    },
    {
      name: 'Pintura',
      slug: 'pintura',
      description: 'Alisado de gotelé, pintura de interiores, fachadas y decoración',
      icon: 'brush',
      sortOrder: 6,
      baseLeadCreditCost: 10,
    },
    {
      name: 'Manitas',
      slug: 'manitas',
      description: 'Montaje de muebles, lámparas, cortinas y pequeños arreglos del hogar',
      icon: 'wrench',
      sortOrder: 7,
      baseLeadCreditCost: 8,
    },
    {
      name: 'Suelos',
      slug: 'suelos',
      description: 'Parquet, tarima flotante, suelos laminados, vinílicos y gres',
      icon: 'layers',
      sortOrder: 8,
      baseLeadCreditCost: 14,
    },
    {
      name: 'Reformas Integrales',
      slug: 'reformas',
      description: 'Proyectos integrales de reforma, coordinación de gremios y albañilería general',
      icon: 'hammer',
      sortOrder: 9,
      baseLeadCreditCost: 25,
    },
    {
      name: 'Climatización & Aire',
      slug: 'climatizacion',
      description: 'Instalación y mantenimiento de aire acondicionado, bombas de calor y aerotermia',
      icon: 'thermometer',
      sortOrder: 10,
      baseLeadCreditCost: 16,
    },
    {
      name: 'Cerrajería',
      slug: 'cerrajeria',
      description: 'Apertura de puertas, cambio de cerraduras de seguridad y bombines antibumping',
      icon: 'key',
      sortOrder: 11,
      baseLeadCreditCost: 14,
    },
    {
      name: 'Diseño Web & Digital',
      slug: 'diseno-web',
      description: 'Páginas web profesionales, tiendas online y presencia digital',
      icon: 'monitor',
      sortOrder: 12,
      baseLeadCreditCost: 18,
    },
  ];

  for (const cat of categoriesData) {
    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        type: CategoryType.HYBRID,
        sortOrder: cat.sortOrder,
        baseLeadCreditCost: cat.baseLeadCreditCost,
      },
    });
  }

  console.log(`✅ ${categoriesData.length} Categorías oficiales por defecto creadas con éxito.`);
  console.log('🚀 Base de datos lista en estado puro y seguro.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
