-- AlterTable
ALTER TABLE `pos_transactions` ADD COLUMN `customerEmail` VARCHAR(255) NULL,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `paidAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `remainingBalance` DECIMAL(10, 2) NOT NULL DEFAULT 0;
