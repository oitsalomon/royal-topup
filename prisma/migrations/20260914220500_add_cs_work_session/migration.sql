-- CreateTable
CREATE TABLE "WorkSession" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ip_address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalExpense" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "work_session_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "bank_name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalExpense_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ActivityLog" ADD COLUMN "work_session_id" INTEGER;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "work_session_id" INTEGER;

-- AlterTable
ALTER TABLE "Transfer" ADD COLUMN "work_session_id" INTEGER;

-- AlterTable
ALTER TABLE "Adjustment" ADD COLUMN "work_session_id" INTEGER;

-- AlterTable
ALTER TABLE "DcBos" ADD COLUMN "work_session_id" INTEGER,
ADD COLUMN "bank_name" TEXT;

-- CreateIndex
CREATE INDEX "WorkSession_user_id_idx" ON "WorkSession"("user_id");
CREATE INDEX "WorkSession_started_at_idx" ON "WorkSession"("started_at");
CREATE INDEX "WorkSession_status_idx" ON "WorkSession"("status");
CREATE INDEX "WorkSession_user_id_status_idx" ON "WorkSession"("user_id", "status");

-- CreateIndex
CREATE INDEX "OperationalExpense_user_id_idx" ON "OperationalExpense"("user_id");
CREATE INDEX "OperationalExpense_work_session_id_idx" ON "OperationalExpense"("work_session_id");
CREATE INDEX "OperationalExpense_createdAt_idx" ON "OperationalExpense"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_work_session_id_idx" ON "ActivityLog"("work_session_id");

-- CreateIndex
CREATE INDEX "Transaction_work_session_id_idx" ON "Transaction"("work_session_id");

-- CreateIndex
CREATE INDEX "Transfer_work_session_id_idx" ON "Transfer"("work_session_id");
CREATE INDEX "Transfer_from_user_id_idx" ON "Transfer"("from_user_id");
CREATE INDEX "Transfer_createdAt_idx" ON "Transfer"("createdAt");

-- CreateIndex
CREATE INDEX "Adjustment_work_session_id_idx" ON "Adjustment"("work_session_id");
CREATE INDEX "Adjustment_user_id_idx" ON "Adjustment"("user_id");
CREATE INDEX "Adjustment_createdAt_idx" ON "Adjustment"("createdAt");

-- CreateIndex
CREATE INDEX "DcBos_work_session_id_idx" ON "DcBos"("work_session_id");
CREATE INDEX "DcBos_createdAt_idx" ON "DcBos"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkSession" ADD CONSTRAINT "WorkSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalExpense" ADD CONSTRAINT "OperationalExpense_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjustment" ADD CONSTRAINT "Adjustment_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DcBos" ADD CONSTRAINT "DcBos_work_session_id_fkey" FOREIGN KEY ("work_session_id") REFERENCES "WorkSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
