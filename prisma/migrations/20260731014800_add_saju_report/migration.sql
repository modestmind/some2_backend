-- CreateTable
CREATE TABLE "saju_report" (
    "report_id" BIGSERIAL NOT NULL,
    "saju_profile_id" BIGINT NOT NULL,
    "user_id" VARCHAR(10) NOT NULL,
    "report_section1" TEXT,
    "report_section2" TEXT,
    "report_section3" TEXT,
    "report_section4" TEXT,
    "report_section5" TEXT,
    "report_section6" TEXT,
    "report_section7" TEXT,
    "report_section8" TEXT,
    "report_section9" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saju_report_pkey" PRIMARY KEY ("report_id")
);

-- CreateIndex
CREATE INDEX "idx_saju_report_saju_profile_id" ON "saju_report"("saju_profile_id");

-- CreateIndex
CREATE INDEX "idx_saju_report_user_id" ON "saju_report"("user_id");

-- AddForeignKey
ALTER TABLE "saju_report" ADD CONSTRAINT "saju_report_saju_profile_id_fkey" FOREIGN KEY ("saju_profile_id") REFERENCES "saju_profile"("saju_profile_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saju_report" ADD CONSTRAINT "saju_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
