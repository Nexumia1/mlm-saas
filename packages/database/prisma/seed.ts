import { PrismaClient, UserRole, Plan, LeadStatus, ContactSource } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Crear tenant demo
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-agency' },
    update: {},
    create: {
      name: 'Demo Agency MLM',
      slug: 'demo-agency',
      plan: Plan.PRO,
      isActive: true,
    },
  });

  console.log('✅ Tenant creado:', tenant.slug);

  // Crear super admin
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@mlmsaas.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@mlmsaas.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.AGENCY_ADMIN,
      emailVerified: true,
    },
  });

  // Crear líder MLM
  const leader = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'lider@mlmsaas.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'lider@mlmsaas.com',
      password: hashedPassword,
      firstName: 'María',
      lastName: 'González',
      role: UserRole.MLM_LEADER,
      emailVerified: true,
    },
  });

  // Crear afiliado
  const affiliate = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'afiliado@mlmsaas.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'afiliado@mlmsaas.com',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Rodríguez',
      role: UserRole.AFFILIATE,
      emailVerified: true,
    },
  });

  console.log('✅ Usuarios creados');

  // Crear contactos y leads de ejemplo
  const contactsData = [
    { firstName: 'Ana', lastName: 'López', email: 'ana@example.com', phone: '+573001234567', source: ContactSource.META_ADS },
    { firstName: 'Pedro', lastName: 'Martínez', email: 'pedro@example.com', phone: '+573007654321', source: ContactSource.WHATSAPP },
    { firstName: 'Laura', lastName: 'Sánchez', email: 'laura@example.com', phone: '+573009876543', source: ContactSource.LANDING_PAGE },
    { firstName: 'Diego', lastName: 'Torres', email: 'diego@example.com', phone: '+573001122334', source: ContactSource.META_ADS },
    { firstName: 'Valentina', lastName: 'Cruz', email: 'val@example.com', phone: '+573005544332', source: ContactSource.TIKTOK_ADS },
  ];

  for (const contactData of contactsData) {
    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        ...contactData,
        tags: ['prospecto', 'interesado'],
      },
    });

    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        contactId: contact.id,
        createdById: admin.id,
        assignedToId: Math.random() > 0.5 ? leader.id : affiliate.id,
        title: `Lead de ${contact.firstName}`,
        value: Math.floor(Math.random() * 5000) + 500,
        status: Object.values(LeadStatus)[Math.floor(Math.random() * Object.values(LeadStatus).length)],
        score: Math.floor(Math.random() * 100),
        source: contactData.source,
      },
    });
  }

  console.log('✅ Contactos y leads de ejemplo creados');
  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Admin: admin@mlmsaas.com / Admin123!');
  console.log('   Líder: lider@mlmsaas.com / Admin123!');
  console.log('   Afiliado: afiliado@mlmsaas.com / Admin123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
