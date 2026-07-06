-- AlterTable
ALTER TABLE `student_installment_requests` ADD COLUMN `reviewedById` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `student_installments` ADD COLUMN `lateFee` DECIMAL(10, 2) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `paidById` VARCHAR(255) NULL,
    ADD COLUMN `paymentMethod` VARCHAR(50) NULL,
    ADD COLUMN `remindedAt` DATETIME(0) NULL;

-- AddForeignKey
ALTER TABLE `student_installment_requests` ADD CONSTRAINT `student_installment_requests_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_installments` ADD CONSTRAINT `student_installments_paidById_fkey` FOREIGN KEY (`paidById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
