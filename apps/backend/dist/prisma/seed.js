"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const argon2 = __importStar(require("argon2"));
process.loadEnvFile?.();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Iniciando carga de datos semilla para Zaragoza...');
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
    const defaultPasswordHash = await argon2.hash('Password123!#');
    const adminPasswordHash = await argon2.hash('AdminPassword123!#');
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@yewi.com',
            passwordHash: adminPasswordHash,
            roles: [client_1.UserRole.ADMIN, client_1.UserRole.CLIENT],
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'Admin',
                    lastName: 'Yewi',
                    displayName: 'Administrador Zaragoza',
                    city: 'Zaragoza',
                    country: 'España',
                },
            },
            wallet: {
                create: {
                    creditBalance: 1000,
                    fiatAvailableBalance: 5000.0,
                },
            },
        },
    });
    const categoriesData = [
        { name: 'Electricidad', slug: 'electricidad', description: 'Instalaciones, cuadros, boletines y averías', icon: 'zap', sortOrder: 1 },
        { name: 'Fontanería', slug: 'fontaneria', description: 'Fugas de agua, calderas, grifería y desatascos', icon: 'droplets', sortOrder: 2 },
        { name: 'Baños', slug: 'banos', description: 'Cambio de bañera por plato, mamparas y sanitarios', icon: 'bath', sortOrder: 3 },
        { name: 'Cocina', slug: 'cocina', description: 'Muebles a medida, encimeras e instalaciones', icon: 'utensils', sortOrder: 4 },
        { name: 'Pladur', slug: 'pladur', description: 'Tabiquería seca, techos continuos e insonorización', icon: 'square', sortOrder: 5 },
        { name: 'Pintura', slug: 'pintura', description: 'Alisado de gotelé, interiores, fachadas y decoración', icon: 'brush', sortOrder: 6 },
        { name: 'Manitas', slug: 'manitas', description: 'Montaje de muebles, lámparas y pequeños arreglos', icon: 'wrench', sortOrder: 7 },
        { name: 'Suelos', slug: 'suelos', description: 'Parquet, tarima flotante, laminados y gres', icon: 'layers', sortOrder: 8 },
        { name: 'Reformas', slug: 'reformas', description: 'Proyectos integrales y albañilería general', icon: 'hammer', sortOrder: 9 },
        { name: 'Limpieza', slug: 'limpieza', description: 'Fin de obra, limpieza de pisos y oficinas', icon: 'sparkles', sortOrder: 10 },
        { name: 'Cerrajería', slug: 'cerrajeria', description: 'Aperturas 24h, cambio de bombines y cerraduras', icon: 'key', sortOrder: 11 },
        { name: 'Climatización', slug: 'climatizacion', description: 'Aire acondicionado, bombas de calor y calefacción', icon: 'flame', sortOrder: 12 },
    ];
    const createdCategories = {};
    for (const cat of categoriesData) {
        const created = await prisma.category.create({
            data: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                icon: cat.icon,
                type: client_1.CategoryType.HYBRID,
                sortOrder: cat.sortOrder,
                baseLeadCreditCost: 12,
            },
        });
        createdCategories[cat.slug] = created;
    }
    console.log('✅ 12 Categorías oficiales de Zaragoza creadas');
    const proCarlos = await prisma.user.create({
        data: {
            email: 'carlos.fontanero@yewi.es',
            passwordHash: defaultPasswordHash,
            roles: [client_1.UserRole.PROFESSIONAL, client_1.UserRole.CLIENT],
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'Carlos',
                    lastName: 'Mendoza',
                    displayName: 'Carlos M. - Fontanería Ebro',
                    phoneNumber: '+34611223344',
                    city: 'Zaragoza',
                    country: 'España',
                    address: 'Calle Alfonso I, 14',
                    postalCode: '50001',
                    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
                },
            },
            professionalProfile: {
                create: {
                    businessName: 'Fontanería & Calefacción Ebro SL',
                    taxId: 'B50112233',
                    bio: 'Fontanero profesional con más de 12 años de experiencia en Zaragoza. Especialista en fugas urgentes, cambio de calderas y termos.',
                    hourlyRate: 40.0,
                    latitude: 41.6561,
                    longitude: -0.8773,
                    serviceRadiusKm: 50,
                    city: 'Zaragoza',
                    postalCode: '50001',
                    country: 'España',
                    kycStatus: client_1.KycStatus.VERIFIED,
                    badges: ['VERIFIED_PRO', 'TOP_RATED'],
                    avgRating: 4.9,
                    totalReviews: 34,
                    completedOrdersCount: 42,
                    responseTimeHours: 1,
                    skills: ['Fontanería', 'Calderas', 'Desatascos', 'Baños'],
                    categories: {
                        connect: [
                            { id: createdCategories['fontaneria'].id },
                            { id: createdCategories['banos'].id },
                        ],
                    },
                },
            },
            wallet: {
                create: { creditBalance: 90, fiatAvailableBalance: 650.0 },
            },
        },
        include: { professionalProfile: true },
    });
    const proElena = await prisma.user.create({
        data: {
            email: 'elena.electricidad@yewi.es',
            passwordHash: defaultPasswordHash,
            roles: [client_1.UserRole.PROFESSIONAL, client_1.UserRole.CLIENT],
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'Elena',
                    lastName: 'Ruiz',
                    displayName: 'Elena Ruiz - Electricista Autorizada',
                    phoneNumber: '+34622334455',
                    city: 'Zaragoza',
                    country: 'España',
                    address: 'Calle María Zambrano, 25',
                    postalCode: '50018',
                    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
                },
            },
            professionalProfile: {
                create: {
                    businessName: 'Instalaciones Eléctricas Actur',
                    taxId: 'B50223344',
                    bio: 'Instaladora electricista autorizada en Zaragoza. Boletines eléctricos, cuadros de automáticos, cableado e iluminación LED eficiente.',
                    hourlyRate: 38.0,
                    latitude: 41.6702,
                    longitude: -0.8872,
                    serviceRadiusKm: 40,
                    city: 'Zaragoza',
                    postalCode: '50018',
                    country: 'España',
                    kycStatus: client_1.KycStatus.VERIFIED,
                    badges: ['VERIFIED_PRO', 'RAPID_RESPONSE'],
                    avgRating: 5.0,
                    totalReviews: 29,
                    completedOrdersCount: 38,
                    responseTimeHours: 1,
                    skills: ['Electricidad', 'Boletines', 'Cuadros Eléctricos', 'Iluminación'],
                    categories: {
                        connect: [
                            { id: createdCategories['electricidad'].id },
                            { id: createdCategories['climatizacion'].id },
                        ],
                    },
                },
            },
            wallet: {
                create: { creditBalance: 110, fiatAvailableBalance: 980.0 },
            },
        },
        include: { professionalProfile: true },
    });
    const proDavid = await prisma.user.create({
        data: {
            email: 'david.reformas@yewi.es',
            passwordHash: defaultPasswordHash,
            roles: [client_1.UserRole.PROFESSIONAL, client_1.UserRole.CLIENT],
            isEmailVerified: true,
            profile: {
                create: {
                    firstName: 'David',
                    lastName: 'Navarro',
                    displayName: 'David Navarro - Reformas Delicias',
                    phoneNumber: '+34633445566',
                    city: 'Zaragoza',
                    country: 'España',
                    address: 'Avenida Madrid, 80',
                    postalCode: '50010',
                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
                },
            },
            professionalProfile: {
                create: {
                    businessName: 'Reformas & Pintura Zaragoza SL',
                    taxId: 'B50334455',
                    bio: 'Especialistas en reformas completas de baños, cocinas, pladur y alisado de gotelé. Presupuestos cerrados sin sobrecostes.',
                    hourlyRate: 42.0,
                    latitude: 41.6542,
                    longitude: -0.9056,
                    serviceRadiusKm: 60,
                    city: 'Zaragoza',
                    postalCode: '50010',
                    country: 'España',
                    kycStatus: client_1.KycStatus.VERIFIED,
                    badges: ['VERIFIED_PRO', 'TOP_RATED'],
                    avgRating: 4.8,
                    totalReviews: 45,
                    completedOrdersCount: 52,
                    responseTimeHours: 2,
                    skills: ['Reformas', 'Pintura', 'Pladur', 'Suelos', 'Cocina'],
                    categories: {
                        connect: [
                            { id: createdCategories['reformas'].id },
                            { id: createdCategories['pintura'].id },
                            { id: createdCategories['pladur'].id },
                            { id: createdCategories['suelos'].id },
                        ],
                    },
                },
            },
            wallet: {
                create: { creditBalance: 75, fiatAvailableBalance: 1400.0 },
            },
        },
        include: { professionalProfile: true },
    });
    const gig1 = await prisma.gig.create({
        data: {
            professionalProfileId: proCarlos.professionalProfile.id,
            categoryId: createdCategories['fontaneria'].id,
            title: 'Reparación urgente de fugas, desatascos y termos',
            slug: 'reparacion-fugas-desatascos-zaragoza',
            description: 'Servicio rápido de fontanería para cualquier avería en Zaragoza: reparación de tuberías, grifería, cisternas, termos y desatascos.',
            coverImages: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600'],
            status: 'ACTIVE',
            avgRating: 4.9,
            totalReviews: 26,
            packages: {
                create: [
                    {
                        tier: client_1.PackageTier.BASIC,
                        name: 'Diagnóstico & Reparación Básica',
                        description: 'Localización de avería y reparación de fuga simple o grifo.',
                        price: 35.0,
                        deliveryDays: 1,
                        revisions: 1,
                    },
                    {
                        tier: client_1.PackageTier.STANDARD,
                        name: 'Reparación Completa / Desatasco',
                        description: 'Desatasco con máquina o reparación de tubería multicapa.',
                        price: 85.0,
                        deliveryDays: 1,
                        revisions: 2,
                    },
                    {
                        tier: client_1.PackageTier.PREMIUM,
                        name: 'Sustitución de Termo / Caldera',
                        description: 'Instalación completa de termo eléctrico o caldera con certificado.',
                        price: 180.0,
                        deliveryDays: 2,
                        revisions: 3,
                    },
                ],
            },
        },
    });
    const gig2 = await prisma.gig.create({
        data: {
            professionalProfileId: proElena.professionalProfile.id,
            categoryId: createdCategories['electricidad'].id,
            title: 'Instalación de cuadros eléctricos, boletines y luces LED',
            slug: 'instalacion-cuadros-boletines-zaragoza',
            description: 'Revisión y actualización de instalaciones eléctricas, cuadro de automáticos, boletines oficiales CIE y colocación de puntos de luz LED.',
            coverImages: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600'],
            status: 'ACTIVE',
            avgRating: 5.0,
            totalReviews: 31,
            packages: {
                create: [
                    {
                        tier: client_1.PackageTier.BASIC,
                        name: 'Revisión de Avería Eléctrica',
                        description: 'Detección de cortocircuito o sustitución de térmico.',
                        price: 40.0,
                        deliveryDays: 1,
                        revisions: 1,
                    },
                    {
                        tier: client_1.PackageTier.STANDARD,
                        name: 'Boletín Eléctrico Oficial (CIE)',
                        description: 'Inspección técnica completa y tramitación del boletín.',
                        price: 120.0,
                        deliveryDays: 2,
                        revisions: 2,
                    },
                ],
            },
        },
    });
    const gig3 = await prisma.gig.create({
        data: {
            professionalProfileId: proDavid.professionalProfile.id,
            categoryId: createdCategories['pintura'].id,
            title: 'Pintura plástica y alisado de paredes en Zaragoza',
            slug: 'pintura-plastica-alisado-zaragoza',
            description: 'Pintado profesional de pisos, habitaciones y techos. Eliminación de gotelé y aplicación de pintura plástica lavable de alta calidad.',
            coverImages: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600'],
            status: 'ACTIVE',
            avgRating: 4.8,
            totalReviews: 19,
            packages: {
                create: [
                    {
                        tier: client_1.PackageTier.BASIC,
                        name: 'Pintura Habitación Individual',
                        description: 'Pintado de paredes y techo hasta 15m² con pintura blanca o color suave.',
                        price: 150.0,
                        deliveryDays: 1,
                        revisions: 1,
                    },
                    {
                        tier: client_1.PackageTier.STANDARD,
                        name: 'Piso Completo (hasta 70m²)',
                        description: 'Pintado integral de todas las estancias con protección de muebles.',
                        price: 580.0,
                        deliveryDays: 3,
                        revisions: 2,
                    },
                ],
            },
        },
    });
    const gig4 = await prisma.gig.create({
        data: {
            professionalProfileId: proDavid.professionalProfile.id,
            categoryId: createdCategories['banos'].id,
            title: 'Cambio de bañera por plato de ducha antideslizante',
            slug: 'cambio-banera-plato-ducha-zaragoza',
            description: 'Retirada de bañera antigua, desescombro, colocación de plato de ducha de resina, alicatado de zona afectada y grifería termostática.',
            coverImages: ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600'],
            status: 'ACTIVE',
            avgRating: 4.9,
            totalReviews: 22,
            packages: {
                create: [
                    {
                        tier: client_1.PackageTier.BASIC,
                        name: 'Reforma Express Ducha',
                        description: 'Cambio de bañera por plato de ducha en 24 horas.',
                        price: 450.0,
                        deliveryDays: 1,
                        revisions: 2,
                    },
                ],
            },
        },
    });
    console.log('✅ Base de datos sembrada con datos 100% reales de Zaragoza.');
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
//# sourceMappingURL=seed.js.map