-- AlterTable
ALTER TABLE "Fisioterapeuta" ADD COLUMN     "refreshTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenHash" TEXT;
