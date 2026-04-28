import { PrismaClient, PlanType, UserStatus, StructureType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed Bilnov...');

  // Admin
  const adminPassword = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bilnov.com' },
    update: {},
    create: {
      email: 'admin@bilnov.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Bilnov',
      status: UserStatus.ACTIVE,
    },
  });

  const org = await prisma.organization.upsert({
    where: { ownerId: admin.id },
    update: {},
    create: {
      name: 'Agence Demo',
      ownerId: admin.id,
      plan: PlanType.PRO,
    },
  });

  // Rôles
  const roles = ['Architecte', 'Chef de projet', 'Électricien', 'Client'];
  const createdRoles: Record<string, string> = {};
  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name: roleName } },
      update: {},
      create: { organizationId: org.id, name: roleName, createdById: admin.id },
    });
    createdRoles[roleName] = role.id;
  }

  // Projet demo
  const project = await prisma.project.upsert({
    where: { id: 'demo-project-001' },
    update: {},
    create: {
      id: 'demo-project-001',
      organizationId: org.id,
      name: 'Appartement T4',
      description: 'Rénovation complète appartement T4',
      structureType: StructureType.BUILDING,
      sector: 'Immobilier',
      createdById: admin.id,
    },
  });

  // Structure
  const rdc = await prisma.projectStructureNode.create({
    data: { projectId: project.id, name: 'RDC', nodeType: 'floor', position: 0 },
  });
  await prisma.projectStructureNode.createMany({
    data: [
      { projectId: project.id, parentId: rdc.id, name: 'Salon', nodeType: 'room', position: 0 },
      { projectId: project.id, parentId: rdc.id, name: 'Cuisine', nodeType: 'room', position: 1 },
    ],
    skipDuplicates: true,
  });

  const etage1 = await prisma.projectStructureNode.create({
    data: { projectId: project.id, name: '1er étage', nodeType: 'floor', position: 1 },
  });
  await prisma.projectStructureNode.createMany({
    data: [
      { projectId: project.id, parentId: etage1.id, name: 'Chambre', nodeType: 'room', position: 0 },
      { projectId: project.id, parentId: etage1.id, name: 'Salle de bain', nodeType: 'room', position: 1 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed terminé !');
  console.log('─────────────────────────────');
  console.log('Admin : admin@bilnov.com / Admin1234!');
  console.log('─────────────────────────────');
}

main()
  .catch((e) => { console.error('❌ Erreur seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
