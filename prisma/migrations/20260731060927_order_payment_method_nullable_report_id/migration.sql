-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "report_id" UUID,
ALTER COLUMN "payment_method" DROP NOT NULL;
