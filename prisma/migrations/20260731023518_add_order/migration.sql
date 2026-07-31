-- CreateTable
CREATE TABLE "orders" (
    "order_id" UUID NOT NULL,
    "user_id" VARCHAR(10) NOT NULL,
    "product_name" VARCHAR(200) NOT NULL,
    "payment_amount" INTEGER NOT NULL,
    "payment_method" VARCHAR(20) NOT NULL,
    "order_status" CHAR(1) NOT NULL DEFAULT 'A',
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "pg_payment_code" VARCHAR(100),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateIndex
CREATE INDEX "idx_order_user_id" ON "orders"("user_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
