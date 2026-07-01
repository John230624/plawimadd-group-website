-- AlterTable
ALTER TABLE `products` ADD COLUMN `costPrice` DECIMAL(10, 2) NULL,
    ADD COLUMN `height` DOUBLE NULL,
    ADD COLUMN `length` DOUBLE NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaTitle` VARCHAR(255) NULL,
    ADD COLUMN `tags` TEXT NULL,
    ADD COLUMN `weight` DOUBLE NULL,
    ADD COLUMN `width` DOUBLE NULL;
