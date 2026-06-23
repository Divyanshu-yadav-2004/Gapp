"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@easycafe.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 12);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: client_1.Role.ADMIN,
            },
        });
        console.log(`Default admin seeded successfully: ${adminEmail}`);
    }
    else {
        console.log(`Admin user already exists: ${adminEmail}`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map