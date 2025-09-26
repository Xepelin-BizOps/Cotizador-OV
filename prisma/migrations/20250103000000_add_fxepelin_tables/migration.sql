-- CreateTable
CREATE TABLE "user_balances" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" SERIAL NOT NULL,
    "from_currency" TEXT NOT NULL,
    "to_currency" TEXT NOT NULL,
    "rate" DECIMAL(10,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_transactions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "from_currency" TEXT,
    "to_currency" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "exchange_rate" DECIMAL(10,4),
    "fee" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "description" TEXT NOT NULL,
    "recipient" TEXT,
    "is_international" BOOLEAN NOT NULL DEFAULT false,
    "concept" TEXT,
    "reference_number" TEXT,
    "tracking_key" TEXT,
    "internal_folio" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_destination_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "swift_code" TEXT,
    "iban" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_destination_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fx_evidence_files" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_type" TEXT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_balances_user_id_currency_idx" ON "user_balances"("user_id", "currency");

-- CreateIndex
CREATE INDEX "exchange_rates_from_to_currency_idx" ON "exchange_rates"("from_currency", "to_currency");

-- CreateIndex
CREATE INDEX "fx_transactions_user_id_idx" ON "fx_transactions"("user_id");

-- CreateIndex
CREATE INDEX "fx_transactions_status_idx" ON "fx_transactions"("status");

-- CreateIndex
CREATE INDEX "fx_transactions_created_at_idx" ON "fx_transactions"("created_at");

-- CreateIndex
CREATE INDEX "fx_destination_accounts_user_id_idx" ON "fx_destination_accounts"("user_id");

-- CreateIndex
CREATE INDEX "fx_evidence_files_transaction_id_idx" ON "fx_evidence_files"("transaction_id");

-- AddForeignKey
ALTER TABLE "user_balances" ADD CONSTRAINT "user_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_transactions" ADD CONSTRAINT "fx_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_destination_accounts" ADD CONSTRAINT "fx_destination_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_evidence_files" ADD CONSTRAINT "fx_evidence_files_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "fx_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
