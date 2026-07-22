-- CreateTable
CREATE TABLE `payment_intents` (
    `id` VARCHAR(255) NOT NULL,
    `userId` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `itemsJson` TEXT NOT NULL,
    `shippingJson` TEXT NOT NULL,
    `userEmail` VARCHAR(255) NOT NULL,
    `userPhoneNumber` VARCHAR(20) NULL,
    `transactionId` VARCHAR(255) NULL,
    `orderId` VARCHAR(255) NULL,
    `failureReason` VARCHAR(255) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payment_intents_transactionId_key`(`transactionId`),
    UNIQUE INDEX `payment_intents_orderId_key`(`orderId`),
    INDEX `payment_intents_userId_status_idx`(`userId`, `status`),
    INDEX `payment_intents_status_expiresAt_idx`(`status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `payment_intents` ADD CONSTRAINT `payment_intents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
