-- CreateTable
CREATE TABLE `characteristics` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `characteristics_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category_characteristics` (
    `id` VARCHAR(255) NOT NULL,
    `categoryId` VARCHAR(255) NOT NULL,
    `characteristicId` VARCHAR(255) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `category_characteristics_categoryId_characteristicId_key`(`categoryId`, `characteristicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_characteristics` (
    `id` VARCHAR(255) NOT NULL,
    `productId` VARCHAR(255) NOT NULL,
    `characteristicId` VARCHAR(255) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `product_characteristics_productId_characteristicId_key`(`productId`, `characteristicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `category_characteristics` ADD CONSTRAINT `category_characteristics_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `category_characteristics` ADD CONSTRAINT `category_characteristics_characteristicId_fkey` FOREIGN KEY (`characteristicId`) REFERENCES `characteristics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_characteristics` ADD CONSTRAINT `product_characteristics_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_characteristics` ADD CONSTRAINT `product_characteristics_characteristicId_fkey` FOREIGN KEY (`characteristicId`) REFERENCES `characteristics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
