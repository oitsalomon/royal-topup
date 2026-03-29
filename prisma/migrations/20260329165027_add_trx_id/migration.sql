-- CreateEnum
CREATE TYPE "UserLevel" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "permissions" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "statsResetAt" TIMESTAMP(3),
    "balance_money" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance_chip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "account_name" TEXT,
    "account_number" TEXT,
    "bank_name" TEXT,
    "consecutive_weeks" INTEGER NOT NULL DEFAULT 0,
    "level" "UserLevel" NOT NULL DEFAULT 'BRONZE',
    "tickets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "total_exp" INTEGER NOT NULL DEFAULT 0,
    "whatsapp" TEXT,
    "active_banner_id" TEXT,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "owned_banners" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "balance_bonus" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "referral_code" TEXT,
    "referrer_id" INTEGER,
    "wd_bonus_this_week" BOOLEAN NOT NULL DEFAULT false,
    "weekly_personal_topup_B" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryTicket" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "ticket_code" TEXT NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "prize_desc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVoucher" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quota" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "UserVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralBonusLog" (
    "id" SERIAL NOT NULL,
    "transaction_id" INTEGER,
    "referrer_id" INTEGER NOT NULL,
    "referred_user_id" INTEGER NOT NULL,
    "chip_amount" DOUBLE PRECISION NOT NULL,
    "bonus_amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralBonusLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GAMES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "externalUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "store_name" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "image" TEXT,
    "category" TEXT NOT NULL DEFAULT 'BOTH',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "admin_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "store_name" TEXT,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAccount" (
    "id" SERIAL NOT NULL,
    "game_id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ALL',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameId" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "game_id" INTEGER NOT NULL,
    "game_user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nickname" TEXT,

    CONSTRAINT "UserGameId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyStats" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "total_turnover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "eligible_turnover" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cashback_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_claimed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "trx_id" TEXT,
    "user_wa" TEXT NOT NULL,
    "game_id" INTEGER NOT NULL,
    "user_game_id" TEXT NOT NULL DEFAULT '',
    "nickname" TEXT NOT NULL,
    "amount_chip" DOUBLE PRECISION NOT NULL,
    "amount_money" DOUBLE PRECISION NOT NULL,
    "payment_method_id" INTEGER,
    "withdraw_method_id" INTEGER,
    "proof_image" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "type" TEXT NOT NULL,
    "target_payment_details" TEXT,
    "processed_by_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" SERIAL NOT NULL,
    "from_user_id" INTEGER,
    "to_user_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "from_bank_id" INTEGER,
    "to_bank_id" INTEGER,
    "from_game_account_id" INTEGER,
    "to_game_account_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjustment" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "bank_id" INTEGER,
    "game_account_id" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DcBos" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DcBos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "chip" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawMethod" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePromoConfig" (
    "id" SERIAL NOT NULL,
    "store_name" TEXT NOT NULL,
    "isPromoActive" BOOLEAN NOT NULL DEFAULT false,
    "promoTitle" TEXT NOT NULL DEFAULT 'Special Promo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorePromoConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoPackage" (
    "id" SERIAL NOT NULL,
    "store_promo_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "chip" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PromoPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GameToPaymentMethod" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_account_number_key" ON "User"("account_number");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "User_referral_code_key" ON "User"("referral_code");

-- CreateIndex
CREATE INDEX "LoyaltyLog_user_id_idx" ON "LoyaltyLog"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryTicket_ticket_code_key" ON "LotteryTicket"("ticket_code");

-- CreateIndex
CREATE INDEX "LotteryTicket_period_idx" ON "LotteryTicket"("period");

-- CreateIndex
CREATE INDEX "LotteryTicket_user_id_idx" ON "LotteryTicket"("user_id");

-- CreateIndex
CREATE INDEX "UserVoucher_user_id_idx" ON "UserVoucher"("user_id");

-- CreateIndex
CREATE INDEX "ReferralBonusLog_referrer_id_idx" ON "ReferralBonusLog"("referrer_id");

-- CreateIndex
CREATE INDEX "ReferralBonusLog_transaction_id_idx" ON "ReferralBonusLog"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "Game_code_key" ON "Game"("code");

-- CreateIndex
CREATE INDEX "Game_isActive_createdAt_idx" ON "Game"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "GameAccount_isActive_balance_idx" ON "GameAccount"("isActive", "balance");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_user_id_idx" ON "ActivityLog"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameId_user_id_game_id_game_user_id_key" ON "UserGameId"("user_id", "game_id", "game_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyStats_user_id_week_start_key" ON "WeeklyStats"("user_id", "week_start");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_trx_id_key" ON "Transaction"("trx_id");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_user_wa_idx" ON "Transaction"("user_wa");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "Transaction"("user_id");

-- CreateIndex
CREATE INDEX "Transaction_processed_by_id_idx" ON "Transaction"("processed_by_id");

-- CreateIndex
CREATE INDEX "Transaction_type_status_createdAt_idx" ON "Transaction"("type", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_status_createdAt_idx" ON "Transaction"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE UNIQUE INDEX "StorePromoConfig_store_name_key" ON "StorePromoConfig"("store_name");

-- CreateIndex
CREATE UNIQUE INDEX "_GameToPaymentMethod_AB_unique" ON "_GameToPaymentMethod"("A", "B");

-- CreateIndex
CREATE INDEX "_GameToPaymentMethod_B_index" ON "_GameToPaymentMethod"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryTicket" ADD CONSTRAINT "LotteryTicket_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBonusLog" ADD CONSTRAINT "ReferralBonusLog_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBonusLog" ADD CONSTRAINT "ReferralBonusLog_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBonusLog" ADD CONSTRAINT "ReferralBonusLog_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAccount" ADD CONSTRAINT "GameAccount_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameId" ADD CONSTRAINT "UserGameId_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameId" ADD CONSTRAINT "UserGameId_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyStats" ADD CONSTRAINT "WeeklyStats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_processed_by_id_fkey" FOREIGN KEY ("processed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_withdraw_method_id_fkey" FOREIGN KEY ("withdraw_method_id") REFERENCES "WithdrawMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_from_bank_id_fkey" FOREIGN KEY ("from_bank_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_from_game_account_id_fkey" FOREIGN KEY ("from_game_account_id") REFERENCES "GameAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_to_bank_id_fkey" FOREIGN KEY ("to_bank_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_to_game_account_id_fkey" FOREIGN KEY ("to_game_account_id") REFERENCES "GameAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "PaymentMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_game_account_id_fkey" FOREIGN KEY ("game_account_id") REFERENCES "GameAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DcBos" ADD CONSTRAINT "DcBos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoPackage" ADD CONSTRAINT "PromoPackage_store_promo_id_fkey" FOREIGN KEY ("store_promo_id") REFERENCES "StorePromoConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPaymentMethod" ADD CONSTRAINT "_GameToPaymentMethod_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GameToPaymentMethod" ADD CONSTRAINT "_GameToPaymentMethod_B_fkey" FOREIGN KEY ("B") REFERENCES "PaymentMethod"("id") ON DELETE CASCADE ON UPDATE CASCADE;
