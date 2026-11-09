-- CreateTable emergency_mailing_lists
CREATE TABLE IF NOT EXISTS "emergency_mailing_lists" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "added_by" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_mailing_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable emergency_dispatch_logs
CREATE TABLE IF NOT EXISTS "emergency_dispatch_logs" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "alert_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL DEFAULT 'CRITICAL',
    "recipients" JSONB NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "error_message" TEXT,
    "latency_ms" INTEGER NOT NULL,
    "triggered_by" VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_dispatch_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "emergency_mailing_lists_email_key" ON "emergency_mailing_lists"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_mailing_lists_is_active_idx" ON "emergency_mailing_lists"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_dispatch_logs_status_idx" ON "emergency_dispatch_logs"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_dispatch_logs_alert_type_idx" ON "emergency_dispatch_logs"("alert_type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "emergency_dispatch_logs_created_at_idx" ON "emergency_dispatch_logs"("created_at");
