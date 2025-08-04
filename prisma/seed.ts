import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create sample users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alice Johnson",
        email: "alice@example.com",
        signup_source: "organic",
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    }),
    prisma.user.create({
      data: {
        name: "Bob Smith",
        email: "bob@example.com",
        signup_source: "referral",
        created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
    }),
    prisma.user.create({
      data: {
        name: "Carol Davis",
        email: "carol@example.com",
        signup_source: "paid",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    }),
    prisma.user.create({
      data: {
        name: "David Wilson",
        email: "david@example.com",
        signup_source: "organic",
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    }),
    prisma.user.create({
      data: {
        name: "Eva Brown",
        email: "eva@example.com",
        signup_source: "referral",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create sample payments
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        user_id: users[0].id,
        amount: 99.99,
        status: "completed",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: users[1].id,
        amount: 149.99,
        status: "completed",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: users[2].id,
        amount: 79.99,
        status: "completed",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: users[3].id,
        amount: 199.99,
        status: "completed",
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.payment.create({
      data: {
        user_id: users[4].id,
        amount: 59.99,
        status: "pending",
        created_at: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${payments.length} payments`);

  // Create sample sessions
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        user_id: users[0].id,
        duration_minutes: 45,
        referrer: "google",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        user_id: users[1].id,
        duration_minutes: 120,
        referrer: "direct",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        user_id: users[2].id,
        duration_minutes: 30,
        referrer: "social",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        user_id: users[3].id,
        duration_minutes: 90,
        referrer: "google",
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.session.create({
      data: {
        user_id: users[4].id,
        duration_minutes: 60,
        referrer: "direct",
        created_at: new Date(),
      },
    }),
  ]);

  console.log(`✅ Created ${sessions.length} sessions`);

  // Create sample referrals
  const referrals = await Promise.all([
    prisma.referral.create({
      data: {
        referrer_id: users[0].id,
        referred_id: users[1].id,
        status: "completed",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.referral.create({
      data: {
        referrer_id: users[2].id,
        referred_id: users[3].id,
        status: "pending",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.referral.create({
      data: {
        referrer_id: users[1].id,
        referred_id: users[4].id,
        status: "completed",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${referrals.length} referrals`);

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
