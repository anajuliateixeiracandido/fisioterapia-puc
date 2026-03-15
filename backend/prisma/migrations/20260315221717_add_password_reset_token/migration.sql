-- AlterTable
ALTER TABLE "Fisioterapeuta" ADD COLUMN     "passwordResetToken" TEXT,
ADD COLUMN     "passwordResetTokenExpiresAt" TIMESTAMP(3);
