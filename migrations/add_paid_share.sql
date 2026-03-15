-- AddColumn to Share table
ALTER TABLE "Share" ADD COLUMN "downloadPriceApt" DOUBLE PRECISION;
ALTER TABLE "Share" ADD COLUMN "sharerWallet" TEXT;

-- CreateTable ShareDownload
CREATE TABLE "ShareDownload" (
    "id" TEXT NOT NULL,
    "shareId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "buyerWallet" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "downloaded" BOOLEAN NOT NULL DEFAULT false,
    "downloadAt" TIMESTAMP(3),

    CONSTRAINT "ShareDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for ShareDownload
CREATE UNIQUE INDEX "ShareDownload_txHash_key" ON "ShareDownload"("txHash");
CREATE INDEX "ShareDownload_shareId_idx" ON "ShareDownload"("shareId");
CREATE INDEX "ShareDownload_txHash_idx" ON "ShareDownload"("txHash");

-- AddForeignKey for ShareDownload
ALTER TABLE "ShareDownload" ADD CONSTRAINT "ShareDownload_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "Share"("id") ON DELETE CASCADE ON UPDATE CASCADE;
