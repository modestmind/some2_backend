-- CreateTable
CREATE TABLE "user" (
    "user_id" VARCHAR(10) NOT NULL,
    "sns_provider_code" VARCHAR(10),
    "sns_user_key" VARCHAR(100),
    "nickname" VARCHAR(50),
    "name" VARCHAR(50),
    "phone_number" VARCHAR(20),
    "status" CHAR(1) NOT NULL,
    "join_channel" VARCHAR(50),
    "join_referer" TEXT,
    "join_device" CHAR(1),
    "join_ip" VARCHAR(45),
    "total_accum_cash" INTEGER NOT NULL DEFAULT 0,
    "cash_balance" INTEGER NOT NULL DEFAULT 0,
    "total_accum_point" INTEGER NOT NULL DEFAULT 0,
    "point_balance" INTEGER NOT NULL DEFAULT 0,
    "referrer_id" VARCHAR(10),
    "is_app_installed" CHAR(1) NOT NULL DEFAULT 'N',
    "app_fcm_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "saju_profile" (
    "saju_profile_id" BIGSERIAL NOT NULL,
    "user_id" VARCHAR(10) NOT NULL,
    "is_self" CHAR(1) NOT NULL DEFAULT 'N',
    "name" VARCHAR(50) NOT NULL,
    "gender" CHAR(1) NOT NULL,
    "birth_date" DATE NOT NULL,
    "calendar_type" CHAR(1) NOT NULL,
    "birth_time" TIME(6),
    "relationship_type" VARCHAR(100),
    "relation_duration" VARCHAR(100),
    "relationship_status" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saju_profile_pkey" PRIMARY KEY ("saju_profile_id")
);

-- CreateTable
CREATE TABLE "user_login_log" (
    "login_log_id" BIGSERIAL NOT NULL,
    "user_id" VARCHAR(10) NOT NULL,
    "login_ip" VARCHAR(45) NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_login_log_pkey" PRIMARY KEY ("login_log_id")
);

-- CreateTable
CREATE TABLE "user_withdrawal" (
    "user_id" VARCHAR(10) NOT NULL,
    "withdraw_status" CHAR(1) NOT NULL DEFAULT 'A',
    "withdrawal_reason" TEXT,
    "request_ip" VARCHAR(45) NOT NULL,
    "withdrawn_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_withdrawal_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "code_group" (
    "code_group_id" SMALLINT NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_group_pkey" PRIMARY KEY ("code_group_id")
);

-- CreateTable
CREATE TABLE "code_detail" (
    "code_group_id" SMALLINT NOT NULL,
    "code_key" VARCHAR(20) NOT NULL,
    "code_name" VARCHAR(80) NOT NULL,
    "code_sub_type" VARCHAR(40),
    "sort_order" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_detail_pkey" PRIMARY KEY ("code_group_id","code_key")
);

-- CreateIndex
CREATE INDEX "idx_user_sns_user_key" ON "user"("sns_user_key");

-- CreateIndex
CREATE INDEX "idx_user_phone_number" ON "user"("phone_number");

-- CreateIndex
CREATE INDEX "idx_user_status" ON "user"("status");

-- CreateIndex
CREATE INDEX "idx_user_join_ip" ON "user"("join_ip");

-- CreateIndex
CREATE INDEX "idx_saju_profile_user_id" ON "saju_profile"("user_id");

-- AddForeignKey
ALTER TABLE "saju_profile" ADD CONSTRAINT "saju_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_login_log" ADD CONSTRAINT "user_login_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_withdrawal" ADD CONSTRAINT "user_withdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "code_detail" ADD CONSTRAINT "code_detail_code_group_id_fkey" FOREIGN KEY ("code_group_id") REFERENCES "code_group"("code_group_id") ON DELETE CASCADE ON UPDATE CASCADE;
