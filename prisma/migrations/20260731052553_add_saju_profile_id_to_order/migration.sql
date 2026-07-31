-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "saju_profile_id" BIGINT;

-- CreateIndex
CREATE INDEX "idx_order_saju_profile_id" ON "orders"("saju_profile_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_saju_profile_id_fkey" FOREIGN KEY ("saju_profile_id") REFERENCES "saju_profile"("saju_profile_id") ON DELETE SET NULL ON UPDATE CASCADE;
