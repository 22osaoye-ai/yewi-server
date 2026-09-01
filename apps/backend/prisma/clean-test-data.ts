import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

process.loadEnvFile?.();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function clean() {
  console.log('🧹 Eliminando datos de prueba / oportunidades inventadas...');
  const deletedUnlocks = await prisma.leadUnlock.deleteMany();
  console.log('Lead unlocks eliminados:', deletedUnlocks.count);

  const deletedProposals = await prisma.quoteProposal.deleteMany();
  console.log('Presupuestos eliminados:', deletedProposals.count);

  const deletedMilestones = await prisma.orderMilestone.deleteMany();
  const deletedDeliveries = await prisma.orderDelivery.deleteMany();
  const deletedDisputes = await prisma.orderDispute.deleteMany();
  const deletedOrders = await prisma.order.deleteMany();
  console.log('Pedidos eliminados:', deletedOrders.count);

  const deletedRequests = await prisma.serviceRequest.deleteMany();
  console.log('Solicitudes de servicio (oportunidades) eliminadas:', deletedRequests.count);

  const deletedNotifications = await prisma.notification.deleteMany();
  console.log('Notificaciones eliminadas:', deletedNotifications.count);

  console.log('✨ Base de datos limpia de datos de prueba.');
  await prisma.$disconnect();
  await pool.end();
}

clean().catch((e) => {
  console.error(e);
  process.exit(1);
});
