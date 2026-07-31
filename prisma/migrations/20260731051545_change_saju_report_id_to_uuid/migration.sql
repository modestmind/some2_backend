/*
  Warnings:

  - The primary key for the `saju_report` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `report_id` on the `saju_report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "saju_report" DROP CONSTRAINT "saju_report_pkey",
DROP COLUMN "report_id",
ADD COLUMN     "report_id" UUID NOT NULL,
ADD CONSTRAINT "saju_report_pkey" PRIMARY KEY ("report_id");
