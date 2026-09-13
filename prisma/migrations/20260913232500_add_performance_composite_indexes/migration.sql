-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_user_game_id_idx" ON "Transaction"("user_game_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_status_idx" ON "Transaction"("createdAt", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_type_idx" ON "Transaction"("createdAt", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Transaction_type_createdAt_idx" ON "Transaction"("type", "createdAt");
