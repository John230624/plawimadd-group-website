-- AlterTable
ALTER TABLE `pos_sessions` ADD COLUMN `closingCash` DECIMAL(12, 2) NULL,
    ADD COLUMN `closingNotes` TEXT NULL,
    ADD COLUMN `expectedCash` DECIMAL(12, 2) NULL,
    ADD COLUMN `openingFloat` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `variance` DECIMAL(12, 2) NULL;

-- AlterTable
ALTER TABLE `pos_transactions` ADD COLUMN `customerAddress` TEXT NULL,
    ADD COLUMN `customerIFU` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `lowStockThreshold` INTEGER NULL DEFAULT 5;

-- CreateTable
CREATE TABLE IF NOT EXISTS `hero_slides` (
    `id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `tagline` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `image` VARCHAR(255) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `bgColor` VARCHAR(50) NOT NULL,
    `accentColor` VARCHAR(50) NOT NULL,
    `layout` VARCHAR(50) NOT NULL,
    `order` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `custom_offers` (
    `id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `badgeText` VARCHAR(255) NOT NULL DEFAULT 'PROMO',
    `image` VARCHAR(255) NOT NULL DEFAULT '/images/background_etudiant2.jpg',
    `detailsJson` TEXT NOT NULL DEFAULT '[]',
    `buttonText` VARCHAR(255) NOT NULL DEFAULT 'Voir l''offre',
    `buttonUrl` VARCHAR(255) NOT NULL DEFAULT '/offer',
    `bgColor` VARCHAR(255) NOT NULL DEFAULT 'bg-slate-950',
    `textColor` VARCHAR(255) NOT NULL DEFAULT 'text-white',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isStudent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `normalized_invoices` (
    `id` VARCHAR(255) NOT NULL,
    `source` ENUM('ORDER', 'POS') NOT NULL,
    `type` ENUM('FV', 'FA', 'EV', 'EA') NOT NULL DEFAULT 'FV',
    `status` ENUM('DRAFT', 'CONFIRMED', 'CANCELLED', 'ERROR') NOT NULL DEFAULT 'DRAFT',
    `orderId` VARCHAR(255) NULL,
    `posTransactionId` VARCHAR(255) NULL,
    `ifu` VARCHAR(50) NOT NULL,
    `aib` VARCHAR(5) NULL,
    `environment` VARCHAR(10) NOT NULL DEFAULT 'TEST',
    `emecefUid` VARCHAR(100) NULL,
    `nim` VARCHAR(50) NULL,
    `counters` VARCHAR(100) NULL,
    `ni` VARCHAR(100) NULL,
    `codeMecef` TEXT NULL,
    `qrCode` TEXT NULL,
    `emecefDate` DATETIME(3) NULL,
    `totalTaxable` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalTax` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `totalTTC` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `currency` VARCHAR(10) NOT NULL DEFAULT 'XOF',
    `referenceUid` VARCHAR(100) NULL,
    `rawRequest` TEXT NULL,
    `rawResponse` TEXT NULL,
    `errorCode` VARCHAR(100) NULL,
    `errorDesc` TEXT NULL,
    `createdById` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `confirmedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `normalized_invoices_orderId_key`(`orderId`),
    UNIQUE INDEX `normalized_invoices_posTransactionId_key`(`posTransactionId`),
    INDEX `normalized_invoices_status_idx`(`status`),
    INDEX `normalized_invoices_nim_idx`(`nim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `stock_movements` (
    `id` VARCHAR(255) NOT NULL,
    `productId` VARCHAR(255) NOT NULL,
    `variantId` VARCHAR(255) NULL,
    `type` ENUM('IN', 'OUT', 'ADJUSTMENT', 'INVENTORY') NOT NULL,
    `quantity` INTEGER NOT NULL,
    `stockBefore` INTEGER NOT NULL,
    `stockAfter` INTEGER NOT NULL,
    `reason` VARCHAR(255) NULL,
    `reference` VARCHAR(255) NULL,
    `unitCost` DECIMAL(10, 2) NULL,
    `userId` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stock_movements_productId_idx`(`productId`),
    INDEX `stock_movements_type_idx`(`type`),
    INDEX `stock_movements_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `contactName` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `ifu` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `purchases` (
    `id` VARCHAR(255) NOT NULL,
    `supplierId` VARCHAR(255) NOT NULL,
    `reference` VARCHAR(50) NOT NULL,
    `status` ENUM('PENDING', 'RECEIVED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `totalAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `paidAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `createdById` VARCHAR(255) NULL,
    `receivedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchases_reference_key`(`reference`),
    INDEX `purchases_supplierId_idx`(`supplierId`),
    INDEX `purchases_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `purchase_items` (
    `id` VARCHAR(255) NOT NULL,
    `purchaseId` VARCHAR(255) NOT NULL,
    `productId` VARCHAR(255) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `unitCost` DECIMAL(10, 2) NOT NULL,
    `totalCost` DECIMAL(12, 2) NOT NULL,

    INDEX `purchase_items_purchaseId_idx`(`purchaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `supplier_payments` (
    `id` VARCHAR(255) NOT NULL,
    `supplierId` VARCHAR(255) NOT NULL,
    `purchaseId` VARCHAR(255) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `method` VARCHAR(30) NOT NULL DEFAULT 'CASH',
    `reference` VARCHAR(255) NULL,
    `notes` TEXT NULL,
    `userId` VARCHAR(255) NULL,
    `paidAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `supplier_payments_supplierId_idx`(`supplierId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `normalized_invoices` ADD CONSTRAINT `normalized_invoices_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `normalized_invoices` ADD CONSTRAINT `normalized_invoices_posTransactionId_fkey` FOREIGN KEY (`posTransactionId`) REFERENCES `pos_transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_movements` ADD CONSTRAINT `stock_movements_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supplier_payments` ADD CONSTRAINT `supplier_payments_purchaseId_fkey` FOREIGN KEY (`purchaseId`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

