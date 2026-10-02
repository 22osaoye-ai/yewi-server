import { GigDetail } from '@/services/gigsApi';
import { ProfessionalDetail } from '@/services/professionalsApi';

export const SAMPLE_PROJECTS: GigDetail[] = [
  {
    id: 'gig-1',
    title: 'Cocina con Isla',
    slug: 'reforma-cocina-isla',
    description: 'Instalación completa de fontanería, electricidad, encimera de cuarzo y mobiliario lacado en blanco mate.',
    category: { name: 'Reformas' },
    coverImages: [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [
      { id: 'p1-1', tier: 'BASIC', name: 'Básico', description: 'Reforma de fontanería, electricidad y colocación de mobiliario estándar.', price: 2800, deliveryDays: 14, revisions: 2 },
      { id: 'p1-2', tier: 'STANDARD', name: 'Completo', description: 'Incluye encimera de cuarzo Silestone, electrodomésticos integrables e iluminación LED.', price: 3650, deliveryDays: 18, revisions: 3, isPopular: true },
      { id: 'p1-3', tier: 'PREMIUM', name: 'Premium VIP', description: 'Diseño integral 3D con isla central de mármol, grifería empotrada y garantía extendida.', price: 4900, deliveryDays: 21, revisions: 5 },
    ],
    faqs: [
      { question: '¿Incluye la retirada del mobiliario y escombros?', answer: 'Sí, todos nuestros paquetes incluyen el desescombro ecológico y transporte al punto limpio homologado.' },
      { question: '¿Qué garantía tienen los materiales y la instalación?', answer: 'Ofrecemos 24 meses de garantía completa tanto en materiales suministrados como en mano de obra.' },
      { question: '¿Cómo funciona la custodia de pago?', answer: 'Tu dinero queda 100% protegido bajo el sistema de custodia Escrow de Yewi hasta que revises el trabajo final.' },
    ],
    reviews: [
      {
        id: 'rev-1',
        rating: 5,
        comment: 'Trabajo impecable. Cumplieron los 14 días pactados y la isla de cocina quedó de revista.',
        createdAt: '2026-09-12T11:00:00Z',
        author: { profile: { displayName: 'Laura Martí' } },
      },
      {
        id: 'rev-2',
        rating: 5,
        comment: 'Muy profesionales, limpios y atentos a cada detalle. Totalmente recomendados.',
        createdAt: '2026-09-04T16:20:00Z',
        author: { profile: { displayName: 'David Castillo' } },
      },
    ],
    professionalProfile: {
      id: 'pro-1',
      businessName: 'García Reformas & Obras',
      city: 'Madrid',
      avgRating: 5.0,
      totalReviews: 64,
      isPro: true,
      user: {
        profile: {
          displayName: 'García Reformas',
          avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-2',
    title: 'Cuadro Eléctrico',
    slug: 'instalacion-cuadro-electrico',
    description: 'Actualización y sustitución de cuadro eléctrico conforme a normativa REBT, diferencial superinmunizado y certificación.',
    category: { name: 'Electricidad' },
    coverImages: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [
      { id: 'p2-1', tier: 'BASIC', name: 'Básico', description: 'Instalación de cuadro 8 elementos y emisión de boletín eléctrico oficial.', price: 420, deliveryDays: 2, revisions: 1 },
      { id: 'p2-2', tier: 'STANDARD', name: 'Protección Total', description: 'Diferencial superinmunizado clase A, protección contra sobretensiones y boletín.', price: 590, deliveryDays: 2, revisions: 2, isPopular: true },
    ],
    faqs: [
      { question: '¿Entregáis el Boletín Eléctrico (CIE)?', answer: 'Sí, somos instaladores autorizados por el Ministerio de Industria y tramitamos el boletín oficial.' },
      { question: '¿Cuánto tiempo dura la instalación?', answer: 'Normalmente se completa en una sola jornada (4-6 horas) sin cortes prolongados de suministro.' },
    ],
    reviews: [
      {
        id: 'rev-3',
        rating: 5,
        comment: 'Rápidos y muy prolijos. El boletín me llegó al email el mismo día.',
        createdAt: '2026-09-10T14:30:00Z',
        author: { profile: { displayName: 'Marcos Rivas' } },
      },
    ],
    professionalProfile: {
      id: 'pro-2',
      businessName: 'ElectroPro Instalaciones',
      city: 'Barcelona',
      avgRating: 4.9,
      totalReviews: 52,
      isPro: true,
      user: {
        profile: {
          displayName: 'ElectroPro',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-3',
    title: 'Cambio de Bañera',
    slug: 'cambio-banera-ducha',
    description: 'Retirada de bañera antigua, impermeabilización con lámina, colocación de plato de resina extraplano y grifería termostática.',
    category: { name: 'Fontanería' },
    coverImages: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [
      { id: 'p3-1', tier: 'BASIC', name: 'Express 24h', description: 'Retirada de bañera, plato antideslizante de resina y alicatado de zona húmeda.', price: 890, deliveryDays: 1, revisions: 1 },
      { id: 'p3-2', tier: 'STANDARD', name: 'Con Mampara', description: 'Incluye plato de carga mineral, grifería termostática y mampara de cristal templado 6mm.', price: 1290, deliveryDays: 2, revisions: 2, isPopular: true },
    ],
    faqs: [
      { question: '¿Cuánto tiempo se tarda en hacer el cambio?', answer: 'El servicio básico se realiza en 24 horas laborables para que puedas usar la ducha al día siguiente.' },
    ],
    reviews: [
      {
        id: 'rev-4',
        rating: 5,
        comment: 'Increíble cambio en solo un día. Quedó espectacular y recogieron todo el escombro.',
        createdAt: '2026-09-08T18:15:00Z',
        author: { profile: { displayName: 'Elena Gómez' } },
      },
    ],
    professionalProfile: {
      id: 'pro-3',
      businessName: 'Fontanería Soler',
      city: 'Valencia',
      avgRating: 4.9,
      totalReviews: 48,
      isPro: true,
      user: {
        profile: {
          displayName: 'Fontanería Soler',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-4',
    title: 'Aerotermia Clima',
    slug: 'aerotermia-clima',
    description: 'Sistema integral de alta eficiencia energética para calefacción, refrigeración y agua caliente sanitaria con certificado oficial.',
    category: { name: 'Climatización' },
    coverImages: [
      'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p4', tier: 'BASIC', name: 'Básico', description: 'Instalación completa', price: 2150, deliveryDays: 5, revisions: 2 }],
    professionalProfile: {
      id: 'pro-4',
      businessName: 'ClimaExpert Sur',
      city: 'Sevilla',
      avgRating: 4.9,
      totalReviews: 41,
      isPro: true,
      user: {
        profile: {
          displayName: 'ClimaExpert',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-5',
    title: 'Pintura y Alisado',
    slug: 'pintura-alisado-gotele',
    description: 'Alisado profesional de paredes, eliminación de gotelé y acabado en pintura plástica mate lavable de alta gama.',
    category: { name: 'Pintura' },
    coverImages: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p5', tier: 'BASIC', name: 'Básico', description: 'Alisado y 2 manos', price: 680, deliveryDays: 3, revisions: 2 }],
    professionalProfile: {
      id: 'pro-5',
      businessName: 'Pinturas & Estilo BCN',
      city: 'Barcelona',
      avgRating: 5.0,
      totalReviews: 59,
      isPro: true,
      user: {
        profile: {
          displayName: 'Pinturas & Estilo',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-6',
    title: 'Tarima Flotante AC5',
    slug: 'tarima-flotante-ac5',
    description: 'Instalación de suelo laminado de máxima resistencia al desgaste con aislante térmico acústico y rodapié lacado blanco.',
    category: { name: 'Suelos' },
    coverImages: [
      'https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p6', tier: 'BASIC', name: 'Básico', description: 'Suministro e instalación', price: 950, deliveryDays: 2, revisions: 1 }],
    professionalProfile: {
      id: 'pro-6',
      businessName: 'Parquet & Tarimas Norte',
      city: 'Bilbao',
      avgRating: 4.9,
      totalReviews: 67,
      isPro: true,
      user: {
        profile: {
          displayName: 'Parquet Norte',
          avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-7',
    title: 'Tabiquería Pladur',
    slug: 'tabiqueria-insonorizacion-pladur',
    description: 'División de estancias con placa de yeso laminado y aislamiento de lana de roca de alta densidad acústica.',
    category: { name: 'Pladur' },
    coverImages: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p7', tier: 'BASIC', name: 'Básico', description: 'Montaje completo', price: 580, deliveryDays: 2, revisions: 1 }],
    professionalProfile: {
      id: 'pro-7',
      businessName: 'Pladur Master Madrid',
      city: 'Madrid',
      avgRating: 5.0,
      totalReviews: 44,
      isPro: true,
      user: {
        profile: {
          displayName: 'Pladur Master',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-8',
    title: 'Armarios a Medida',
    slug: 'armarios-empotrados-medida',
    description: 'Diseño, fabricación e instalación de armario empotrado con puertas correderas o abatibles y distribución interior a medida.',
    category: { name: 'Carpintería' },
    coverImages: [
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p8', tier: 'BASIC', name: 'Básico', description: 'Fabricación y montaje', price: 1420, deliveryDays: 7, revisions: 2 }],
    professionalProfile: {
      id: 'pro-8',
      businessName: 'Ebanistería Vega',
      city: 'Zaragoza',
      avgRating: 4.9,
      totalReviews: 38,
      isPro: true,
      user: {
        profile: {
          displayName: 'Ebanistería Vega',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-9',
    title: 'Iluminación Led',
    slug: 'iluminacion-led-integral',
    description: 'Proyecto de iluminación indirecta lineal con foseados de pladur, tiras led cob regulables y domótica compatible.',
    category: { name: 'Electricidad' },
    coverImages: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p9', tier: 'BASIC', name: 'Básico', description: 'Instalación y tiras', price: 360, deliveryDays: 1, revisions: 1 }],
    professionalProfile: {
      id: 'pro-9',
      businessName: 'Luz & Espacio Studio',
      city: 'Málaga',
      avgRating: 5.0,
      totalReviews: 73,
      isPro: true,
      user: {
        profile: {
          displayName: 'Luz & Espacio',
          avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
  {
    id: 'gig-10',
    title: 'Baño Minimalista',
    slug: 'reforma-bano-minimalista',
    description: 'Renovación completa de baño con alicatado de gran formato porcelánico rectificado, mueble suspendido y mampara negra.',
    category: { name: 'Baños' },
    coverImages: [
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
    ],
    packages: [{ id: 'p10', tier: 'BASIC', name: 'Básico', description: 'Reforma de baño', price: 1650, deliveryDays: 6, revisions: 2 }],
    professionalProfile: {
      id: 'pro-10',
      businessName: 'Proyectos & Baños Deco',
      city: 'Valencia',
      avgRating: 5.0,
      totalReviews: 56,
      isPro: true,
      user: {
        profile: {
          displayName: 'Baños Deco',
          avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        },
      },
    },
  },
];

export const SAMPLE_PROFESSIONALS: ProfessionalDetail[] = [
  {
    id: 'pro-1',
    businessName: 'García Reformas & Obras',
    bio: 'Especialistas en reformas integrales de viviendas y locales. Más de 15 años de experiencia con acabados de primera calidad.',
    city: 'Madrid',
    province: 'Madrid',
    avgRating: 5.0,
    totalReviews: 64,
    hourlyRate: 35,
    isPro: true,
    skills: ['Reformas', 'Albañilería', 'Alicatado'],
    categories: [{ id: 'cat-reformas', name: 'Reformas', slug: 'reformas' }],
    user: {
      id: 'user-pro-1',
      profile: {
        displayName: 'García Reformas & Obras',
        firstName: 'Manuel',
        lastName: 'García',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80',
        city: 'Madrid',
      },
    },
    portfolioItems: [
      {
        id: 'port-1',
        title: 'Reforma Cocina y Salón',
        description: 'Espacio abierto con isla central y encimera de cuarzo',
        imageUrls: ['https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'],
      },
      {
        id: 'port-1b',
        title: 'Baño de Diseño Minimalista',
        description: 'Ducha italiana con grifería empotrada y resina',
        imageUrls: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80'],
      },
      {
        id: 'port-1c',
        title: 'Salón Luz Indirecta LED',
        description: 'Falsos techos foseados con ambiente cálido',
        imageUrls: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-2',
    businessName: 'ElectroPro Instalaciones',
    bio: 'Electricistas autorizados categoría especialista. Cuadros eléctricos, boletines oficiales, recarga de vehículo eléctrico y domótica.',
    city: 'Barcelona',
    province: 'Barcelona',
    avgRating: 4.9,
    totalReviews: 52,
    hourlyRate: 38,
    isPro: true,
    skills: ['Electricidad', 'Cuadros', 'Boletines'],
    categories: [{ id: 'cat-electricidad', name: 'Electricidad', slug: 'electricidad' }],
    user: {
      id: 'user-pro-2',
      profile: {
        displayName: 'ElectroPro Instalaciones',
        firstName: 'Carlos',
        lastName: 'Navarro',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        city: 'Barcelona',
      },
    },
    portfolioItems: [
      {
        id: 'port-2',
        title: 'Cuadro Eléctrico Industrial',
        description: 'Actualización a normativa REBT y diferenciales clase A',
        imageUrls: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'],
      },
      {
        id: 'port-2b',
        title: 'Instalación Iluminación Foseada',
        description: 'Diseño lumínico arquitectónico en falso techo',
        imageUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80'],
      },
      {
        id: 'port-2c',
        title: 'Punto de Recarga Vehículo Eléctrico',
        description: 'Cargador inteligente de pared con balanceo dinámico',
        imageUrls: ['https://images.unsplash.com/photo-1558441719-8d48980f89a0?auto=format&fit=crop&w=800&q=80'],
      },
      {
        id: 'port-2d',
        title: 'Canalización y Cableado REBT',
        description: 'Instalación completa de circuitos independientes para climatización',
        imageUrls: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
      },
    ],
  },
  {
    id: 'pro-3',
    businessName: 'Fontanería Soler',
    bio: 'Servicio rápido y limpio para cualquier problema de fontanería, cambio de sanitarios, platos de ducha y desatascos en Valencia.',
    city: 'Valencia',
    province: 'Valencia',
    avgRating: 4.9,
    totalReviews: 48,
    hourlyRate: 32,
    isPro: true,
    skills: ['Fontanería', 'Desatascos', 'Platos Ducha'],
    categories: [{ id: 'cat-fontaneria', name: 'Fontanería', slug: 'fontaneria' }],
    user: {
      id: 'user-pro-3',
      profile: {
        displayName: 'Fontanería Soler',
        firstName: 'Javier',
        lastName: 'Soler',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        city: 'Valencia',
      },
    },
    portfolioItems: [
      {
        id: 'port-3',
        title: 'Cambio de Bañera Express',
        description: 'Instalación de plato de resina antideslizante en 24h',
        imageUrls: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
      },
      {
        id: 'port-3b',
        title: 'Batería de Contadores',
        description: 'Renovación de montantes de agua en comunidad',
        imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'],
      },
      {
        id: 'port-3c',
        title: 'Grifería Termostática Empotrada',
        description: 'Instalación de columna de ducha efecto lluvia en negro mate',
        imageUrls: ['https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80'],
      },
    ],
  },
  {
    id: 'pro-4',
    businessName: 'ClimaExpert Sur',
    bio: 'Instalaciones de climatización y aerotermia de alta eficiencia. Climatización frío/calor, conductos y splits con garantía oficial.',
    city: 'Sevilla',
    province: 'Sevilla',
    avgRating: 4.9,
    totalReviews: 41,
    hourlyRate: 40,
    isPro: true,
    skills: ['Climatización', 'Aerotermia', 'Aire Acondicionado'],
    categories: [{ id: 'cat-clima', name: 'Climatización', slug: 'climatizacion' }],
    user: {
      id: 'user-pro-4',
      profile: {
        displayName: 'ClimaExpert Sur',
        firstName: 'Antonio',
        lastName: 'López',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        city: 'Sevilla',
      },
    },
    portfolioItems: [
      {
        id: 'port-4',
        title: 'Instalación de Aerotermia',
        description: 'Bomba de calor inverter con suelo radiante de alta eficiencia',
        imageUrls: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=600&q=80'],
      },
      {
        id: 'port-4b',
        title: 'Climatización por Conductos',
        description: 'Sistema zonificado Airzone con rejillas motorizadas',
        imageUrls: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'],
      },
      {
        id: 'port-4c',
        title: 'MultiSplit A+++ Inverter',
        description: 'Instalación de 3 splits ultrasilenciosos con gas ecológico R32',
        imageUrls: ['https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-5',
    businessName: 'Pinturas & Estilo BCN',
    bio: 'Pintura decorativa y alisado perfecto de paredes. Tratamiento anti-humedad y acabados premium mate lavable de alta durabilidad.',
    city: 'Barcelona',
    province: 'Barcelona',
    avgRating: 5.0,
    totalReviews: 59,
    hourlyRate: 28,
    isPro: true,
    skills: ['Pintura', 'Alisado', 'Decoración'],
    categories: [{ id: 'cat-pintura', name: 'Pintura', slug: 'pintura' }],
    user: {
      id: 'user-pro-5',
      profile: {
        displayName: 'Pinturas & Estilo BCN',
        firstName: 'Elena',
        lastName: 'Rios',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
        city: 'Barcelona',
      },
    },
    portfolioItems: [
      {
        id: 'port-5',
        title: 'Alisado y Pintura Mate',
        description: 'Eliminación completa de gotelé en piso de 90m2',
        imageUrls: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-6',
    businessName: 'Parquet & Tarimas Norte',
    bio: 'Suelos laminados, tarimas flotantes AC5 y restauración de parquet de madera natural. Instalación con aislante acústico premium.',
    city: 'Bilbao',
    province: 'Bizkaia',
    avgRating: 4.9,
    totalReviews: 67,
    hourlyRate: 34,
    isPro: true,
    skills: ['Suelos', 'Tarima', 'Parquet'],
    categories: [{ id: 'cat-suelos', name: 'Suelos', slug: 'suelos' }],
    user: {
      id: 'user-pro-6',
      profile: {
        displayName: 'Parquet & Tarimas Norte',
        firstName: 'Iker',
        lastName: 'Mendoza',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
        city: 'Bilbao',
      },
    },
    portfolioItems: [
      {
        id: 'port-6',
        title: 'Instalación Tarima Roble',
        description: 'Tarima flotante AC5 con rodapié lacado',
        imageUrls: ['https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-7',
    businessName: 'Pladur Master Madrid',
    bio: 'Tabiques de pladur, techos continuos, trasdosados e insonorizaciones acústicas con lana de roca. Rapidez y limpieza garantizada.',
    city: 'Madrid',
    province: 'Madrid',
    avgRating: 5.0,
    totalReviews: 44,
    hourlyRate: 30,
    isPro: true,
    skills: ['Pladur', 'Insonorización', 'Techos'],
    categories: [{ id: 'cat-pladur', name: 'Pladur', slug: 'pladur' }],
    user: {
      id: 'user-pro-7',
      profile: {
        displayName: 'Pladur Master Madrid',
        firstName: 'David',
        lastName: 'Ortega',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
        city: 'Madrid',
      },
    },
    portfolioItems: [
      {
        id: 'port-7',
        title: 'Tabiquería Acústica',
        description: 'División de dormitorios con doble placa y lana',
        imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-8',
    businessName: 'Ebanistería Vega',
    bio: 'Carpintería de madera a medida: armarios empotrados, vestidores, puertas de paso lacadas y muebles de cocina exclusivos.',
    city: 'Zaragoza',
    province: 'Zaragoza',
    avgRating: 4.9,
    totalReviews: 38,
    hourlyRate: 36,
    isPro: true,
    skills: ['Carpintería', 'Armarios', 'Puertas'],
    categories: [{ id: 'cat-carpinteria', name: 'Carpintería', slug: 'carpinteria' }],
    user: {
      id: 'user-pro-8',
      profile: {
        displayName: 'Ebanistería Vega',
        firstName: 'Fernando',
        lastName: 'Vega',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        city: 'Zaragoza',
      },
    },
    portfolioItems: [
      {
        id: 'port-8',
        title: 'Vestidor a Medida',
        description: 'Distribución interior en roble natural con iluminación LED',
        imageUrls: ['https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-9',
    businessName: 'Luz & Espacio Studio',
    bio: 'Proyectos integrales de iluminación arquitectónica, foseados LED y reformas de iluminación para viviendas y comercios.',
    city: 'Málaga',
    province: 'Málaga',
    avgRating: 5.0,
    totalReviews: 73,
    hourlyRate: 42,
    isPro: true,
    skills: ['Electricidad', 'Iluminación', 'LED'],
    categories: [{ id: 'cat-electricidad', name: 'Electricidad', slug: 'electricidad' }],
    user: {
      id: 'user-pro-9',
      profile: {
        displayName: 'Luz & Espacio Studio',
        firstName: 'Pablo',
        lastName: 'Campos',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
        city: 'Málaga',
      },
    },
    portfolioItems: [
      {
        id: 'port-9',
        title: 'Iluminación Indirecta Foseado',
        description: 'Tira LED COB regulable con perfil empotrado',
        imageUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
  {
    id: 'pro-10',
    businessName: 'Proyectos & Baños Deco',
    bio: 'Reformas integrales de baños y aseos: fontanería, mamparas de perfil negro, mobiliario suspendido y porcelánico rectificado.',
    city: 'Valencia',
    province: 'Valencia',
    avgRating: 5.0,
    totalReviews: 56,
    hourlyRate: 35,
    isPro: true,
    skills: ['Baños', 'Reformas', 'Fontanería'],
    categories: [{ id: 'cat-banos', name: 'Baños', slug: 'banos' }],
    user: {
      id: 'user-pro-10',
      profile: {
        displayName: 'Proyectos & Baños Deco',
        firstName: 'Sara',
        lastName: 'Moya',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
        city: 'Valencia',
      },
    },
    portfolioItems: [
      {
        id: 'port-10',
        title: 'Baño Suite Minimalista',
        description: 'Ducha a ras de suelo y grifería empotrada',
        imageUrls: ['https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=600&q=80'],
      },
    ],
  },
];

/**
 * Filtra proyectos de prueba según categoría y texto de búsqueda
 */
export function filterSampleProjects(category?: string | null, query?: string): GigDetail[] {
  let list = [...SAMPLE_PROJECTS];

  if (category && category !== 'Todos') {
    const catLower = category.toLowerCase();
    list = list.filter((p) => p.category?.name?.toLowerCase().includes(catLower));
  }

  if (query && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q) ||
        p.professionalProfile?.businessName?.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Filtra profesionales de prueba según categorías y texto de búsqueda
 */
export function filterSampleProfessionals(
  categories?: string[] | string | null,
  query?: string
): ProfessionalDetail[] {
  let list = [...SAMPLE_PROFESSIONALS];

  const catList = Array.isArray(categories)
    ? categories.filter((c) => c !== 'Todos')
    : categories && categories !== 'Todos'
    ? [categories]
    : [];

  if (catList.length > 0) {
    list = list.filter((p) =>
      catList.some((c) => {
        const cLower = c.toLowerCase();
        return (
          p.skills?.some((s) => s.toLowerCase().includes(cLower)) ||
          p.categories?.some((cat) => cat.name?.toLowerCase().includes(cLower))
        );
      })
    );
  }

  if (query && query.trim().length > 0) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.businessName?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q)) ||
        p.categories?.some((c) => c.name?.toLowerCase().includes(q))
    );
  }

  return list;
}
