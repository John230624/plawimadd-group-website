-- AlterTable
ALTER TABLE `characteristics` ADD COLUMN `attributeType` ENUM('TEXT', 'SELECT', 'MULTI_SELECT', 'RANGE', 'COLOR', 'SIZE') NOT NULL DEFAULT 'SELECT',
    ADD COLUMN `displayOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `isVariant` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `attributesJson` TEXT NULL,
    ADD COLUMN `certifications` TEXT NULL,
    ADD COLUMN `leadTimeRange` VARCHAR(20) NULL,
    ADD COLUMN `moqMax` INTEGER NULL,
    ADD COLUMN `moqMin` INTEGER NULL DEFAULT 1,
    ADD COLUMN `reviewCount` INTEGER NULL DEFAULT 0,
    ADD COLUMN `soldCount` INTEGER NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `product_variants` (
    `id` VARCHAR(255) NOT NULL,
    `productId` VARCHAR(255) NOT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `variantName` VARCHAR(255) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stock` INTEGER NOT NULL DEFAULT 0,
    `leadTimeDays` INTEGER NULL,
    `moq` INTEGER NULL DEFAULT 1,
    `weight` DOUBLE NULL,
    `dimensions` VARCHAR(50) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `attributesJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_variants_sku_key`(`sku`),
    UNIQUE INDEX `product_variants_productId_sku_key`(`productId`, `sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variant_attributes` (
    `id` VARCHAR(255) NOT NULL,
    `variantId` VARCHAR(255) NOT NULL,
    `attributeId` VARCHAR(255) NOT NULL,
    `attributeValueId` VARCHAR(255) NULL,
    `priceModifier` DECIMAL(10, 2) NULL,
    `stockAdjustment` INTEGER NULL,
    `weightModifier` DOUBLE NULL,

    UNIQUE INDEX `variant_attributes_variantId_attributeId_key`(`variantId`, `attributeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `variant_images` (
    `id` VARCHAR(255) NOT NULL,
    `variantId` VARCHAR(255) NOT NULL,
    `imageUrl` VARCHAR(255) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isMainImage` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attribute_values` (
    `id` VARCHAR(255) NOT NULL,
    `characteristicId` VARCHAR(255) NOT NULL,
    `value` VARCHAR(255) NOT NULL,
    `valueSlug` VARCHAR(255) NULL,
    `colorCode` VARCHAR(7) NULL,
    `imageUrl` VARCHAR(255) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `attribute_values_characteristicId_value_key`(`characteristicId`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_variants` ADD CONSTRAINT `product_variants_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_attributeId_fkey` FOREIGN KEY (`attributeId`) REFERENCES `characteristics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_attributes` ADD CONSTRAINT `variant_attributes_attributeValueId_fkey` FOREIGN KEY (`attributeValueId`) REFERENCES `attribute_values`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `variant_images` ADD CONSTRAINT `variant_images_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `product_variants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attribute_values` ADD CONSTRAINT `attribute_values_characteristicId_fkey` FOREIGN KEY (`characteristicId`) REFERENCES `characteristics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
