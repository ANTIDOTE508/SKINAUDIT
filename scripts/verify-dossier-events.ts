// scripts/verify-dossier-events.ts
// Script de vérification ponctuel (aucun framework de test dans ce dépôt —
// voir le plan docs/superpowers/plans/2026-09-15-dossier-product-database.md, Tâche 4).
// Lancer avec : npx tsx scripts/verify-dossier-events.ts
// Nécessite que DATABASE_URL pointe vers une base où le SQL manuel de la
// Tâche 1 (voir ce plan) a déjà été exécuté.

import { prisma } from '../src/lib/prisma'

async function main() {
  const testUserId = `verify-dossier-events-${Date.now()}`

  await prisma.user.create({
    data: { id: testUserId, email: `${testUserId}@example.test`, name: 'Verify Script User' },
  })

  const product = await prisma.product.create({
    data: {
      name: 'Verify Script Test Cleanser',
      slug: `verify-script-test-cleanser-${Date.now()}`,
      category: 'CLEANSING',
      source: 'USER_MANUAL',
      barcode: `test-${Date.now()}`,
    },
  })

  const dossierProduct = await prisma.userDossierProduct.create({
    data: { userId: testUserId, productId: product.id, status: 'ACTIVE' },
  })

  await prisma.dossierProductEvent.create({
    data: { dossierProductId: dossierProduct.id, type: 'ADDED_TO_DOSSIER', metadata: { status: 'ACTIVE' } },
  })

  await prisma.userDossierProduct.update({
    where: { id: dossierProduct.id },
    data: { status: 'SEASONAL' },
  })
  await prisma.dossierProductEvent.create({
    data: {
      dossierProductId: dossierProduct.id,
      type: 'STATUS_CHANGED',
      metadata: { from: 'ACTIVE', to: 'SEASONAL' },
    },
  })

  const events = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: dossierProduct.id },
    orderBy: { occurredAt: 'asc' },
  })

  assertEqual(events.length, 2, 'expected 2 events')
  assertEqual(events[0].type, 'ADDED_TO_DOSSIER', 'first event type')
  assertEqual(events[1].type, 'STATUS_CHANGED', 'second event type')

  const cascadeCheck = await prisma.userDossierProduct.delete({ where: { id: dossierProduct.id } })
  const eventsAfterDelete = await prisma.dossierProductEvent.findMany({
    where: { dossierProductId: cascadeCheck.id },
  })
  assertEqual(eventsAfterDelete.length, 0, 'events should cascade-delete with their dossier product')

  await prisma.product.delete({ where: { id: product.id } })
  await prisma.user.delete({ where: { id: testUserId } })

  console.log('PASS: all dossier event assertions succeeded')
}

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${label} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
