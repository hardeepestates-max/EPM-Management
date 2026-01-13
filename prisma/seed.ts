import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Create Admin User
  const adminPassword = await hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@elevatepm.com" },
    update: {},
    create: {
      email: "admin@elevatepm.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      phone: "(555) 000-0001",
    },
  })
  console.log("Created admin:", admin.email)

  // Create Property Owner
  const ownerPassword = await hash("owner123", 12)
  const owner = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      name: "John Smith",
      password: ownerPassword,
      role: "OWNER",
      phone: "(555) 123-4567",
    },
  })
  console.log("Created owner:", owner.email)

  // Create Tenant
  const tenantPassword = await hash("tenant123", 12)
  const tenant = await prisma.user.upsert({
    where: { email: "tenant@example.com" },
    update: {},
    create: {
      email: "tenant@example.com",
      name: "Sarah Johnson",
      password: tenantPassword,
      role: "TENANT",
      phone: "(555) 987-6543",
    },
  })
  console.log("Created tenant:", tenant.email)

  // Create Second Tenant
  const tenant2Password = await hash("tenant123", 12)
  const tenant2 = await prisma.user.upsert({
    where: { email: "tenant2@example.com" },
    update: {},
    create: {
      email: "tenant2@example.com",
      name: "Mike Brown",
      password: tenant2Password,
      role: "TENANT",
      phone: "(555) 555-1234",
    },
  })
  console.log("Created tenant2:", tenant2.email)

  // Create Property
  const property = await prisma.property.upsert({
    where: { id: "property-1" },
    update: {},
    create: {
      id: "property-1",
      name: "Sunset Apartments",
      address: "123 Sunset Boulevard",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90028",
      description: "Modern apartment complex with great amenities",
      ownerId: owner.id,
      status: "ACTIVE",
    },
  })
  console.log("Created property:", property.name)

  // Create Second Property
  const property2 = await prisma.property.upsert({
    where: { id: "property-2" },
    update: {},
    create: {
      id: "property-2",
      name: "Downtown Lofts",
      address: "456 Main Street",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90012",
      description: "Urban loft living in the heart of downtown",
      ownerId: owner.id,
      status: "ACTIVE",
    },
  })
  console.log("Created property2:", property2.name)

  // Create Units
  const unit1 = await prisma.unit.upsert({
    where: { id: "unit-1" },
    update: {},
    create: {
      id: "unit-1",
      unitNumber: "101",
      bedrooms: 2,
      bathrooms: 1,
      sqft: 850,
      rentAmount: 1800,
      propertyId: property.id,
      status: "OCCUPIED",
    },
  })

  await prisma.unit.upsert({
    where: { id: "unit-2" },
    update: {},
    create: {
      id: "unit-2",
      unitNumber: "102",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 650,
      rentAmount: 1400,
      propertyId: property.id,
      status: "AVAILABLE",
    },
  })

  const unit3 = await prisma.unit.upsert({
    where: { id: "unit-3" },
    update: {},
    create: {
      id: "unit-3",
      unitNumber: "201",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1200,
      rentAmount: 2500,
      propertyId: property.id,
      status: "OCCUPIED",
    },
  })

  await prisma.unit.upsert({
    where: { id: "unit-4" },
    update: {},
    create: {
      id: "unit-4",
      unitNumber: "A1",
      bedrooms: 1,
      bathrooms: 1,
      sqft: 900,
      rentAmount: 2000,
      propertyId: property2.id,
      status: "OCCUPIED",
    },
  })
  console.log("Created units")

  // Create Leases
  const startDate = new Date()
  const endDate = new Date()
  endDate.setFullYear(endDate.getFullYear() + 1)

  await prisma.lease.upsert({
    where: { id: "lease-1" },
    update: {},
    create: {
      id: "lease-1",
      unitId: unit1.id,
      tenantId: tenant.id,
      startDate,
      endDate,
      rentAmount: 1800,
      deposit: 1800,
      status: "ACTIVE",
    },
  })

  await prisma.lease.upsert({
    where: { id: "lease-2" },
    update: {},
    create: {
      id: "lease-2",
      unitId: unit3.id,
      tenantId: tenant2.id,
      startDate,
      endDate,
      rentAmount: 2500,
      deposit: 2500,
      status: "ACTIVE",
    },
  })
  console.log("Created leases")

  // Create Tickets
  const ticket1 = await prisma.ticket.upsert({
    where: { id: "ticket-1" },
    update: {},
    create: {
      id: "ticket-1",
      title: "Leaky faucet in kitchen",
      description: "The kitchen faucet has been dripping for a few days.",
      category: "MAINTENANCE",
      priority: "MEDIUM",
      status: "OPEN",
      userId: tenant.id,
      propertyId: property.id,
      unitId: unit1.id,
    },
  })

  await prisma.ticket.upsert({
    where: { id: "ticket-2" },
    update: {},
    create: {
      id: "ticket-2",
      title: "AC not cooling properly",
      description: "The air conditioning is not working effectively.",
      category: "MAINTENANCE",
      priority: "HIGH",
      status: "IN_PROGRESS",
      userId: tenant2.id,
      propertyId: property.id,
      unitId: unit3.id,
    },
  })

  await prisma.ticket.upsert({
    where: { id: "ticket-3" },
    update: {},
    create: {
      id: "ticket-3",
      title: "Question about lease renewal",
      description: "My lease is coming up for renewal in 3 months.",
      category: "LEASE",
      priority: "LOW",
      status: "OPEN",
      userId: tenant.id,
      propertyId: property.id,
      unitId: unit1.id,
    },
  })
  console.log("Created tickets")

  // Create Ticket Messages
  await prisma.ticketMessage.upsert({
    where: { id: "message-1" },
    update: {},
    create: {
      id: "message-1",
      ticketId: ticket1.id,
      userId: admin.id,
      message: "Thank you for reporting this. We have scheduled a plumber to visit tomorrow between 9 AM and 12 PM.",
    },
  })
  console.log("Created ticket messages")

  // Create Payments
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const thisMonth = new Date()

  await prisma.payment.upsert({
    where: { id: "payment-1" },
    update: {},
    create: {
      id: "payment-1",
      leaseId: "lease-1",
      amount: 1800,
      dueDate: lastMonth,
      paidDate: lastMonth,
      status: "PAID",
    },
  })

  await prisma.payment.upsert({
    where: { id: "payment-2" },
    update: {},
    create: {
      id: "payment-2",
      leaseId: "lease-1",
      amount: 1800,
      dueDate: thisMonth,
      status: "PENDING",
    },
  })
  console.log("Created payments")

  console.log("")
  console.log("Seeding complete!")
  console.log("")
  console.log("Demo accounts:")
  console.log("  Admin:  admin@elevatepm.com / admin123")
  console.log("  Owner:  owner@example.com / owner123")
  console.log("  Tenant: tenant@example.com / tenant123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
