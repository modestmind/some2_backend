/*
  Warnings:

  - Added the required column `day_branch` to the `saju_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `day_stem` to the `saju_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month_branch` to the `saju_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month_stem` to the `saju_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_branch` to the `saju_profile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year_stem` to the `saju_profile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: 기존 행에 임시 default '?' 적용 후 default 제거
ALTER TABLE "saju_profile"
ADD COLUMN "day_branch"   CHAR(1) NOT NULL DEFAULT '?',
ADD COLUMN "day_stem"     CHAR(1) NOT NULL DEFAULT '?',
ADD COLUMN "hour_branch"  CHAR(1),
ADD COLUMN "hour_stem"    CHAR(1),
ADD COLUMN "month_branch" CHAR(1) NOT NULL DEFAULT '?',
ADD COLUMN "month_stem"   CHAR(1) NOT NULL DEFAULT '?',
ADD COLUMN "year_branch"  CHAR(1) NOT NULL DEFAULT '?',
ADD COLUMN "year_stem"    CHAR(1) NOT NULL DEFAULT '?';

ALTER TABLE "saju_profile"
ALTER COLUMN "day_branch"   DROP DEFAULT,
ALTER COLUMN "day_stem"     DROP DEFAULT,
ALTER COLUMN "month_branch" DROP DEFAULT,
ALTER COLUMN "month_stem"   DROP DEFAULT,
ALTER COLUMN "year_branch"  DROP DEFAULT,
ALTER COLUMN "year_stem"    DROP DEFAULT;
