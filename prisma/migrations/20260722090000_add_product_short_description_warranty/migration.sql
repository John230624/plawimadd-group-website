-- AlterTable
-- Les colonnes `shortDescription` et `warranty` existaient dans schema.prisma sans
-- migration correspondante : elles avaient ete ajoutees en dev via `prisma db push`.
-- Les bases deployees via `prisma migrate deploy` ne les ont donc jamais recues.
--
-- L'ajout est conditionne a l'absence de la colonne : selon l'environnement, elle
-- peut deja avoir ete creee a la main ou par `db push`, et un ADD COLUMN sec y
-- echouerait en marquant la migration en echec.

SET @stmt := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `products` ADD COLUMN `shortDescription` TEXT NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'shortDescription'
);
PREPARE addShortDescription FROM @stmt;
EXECUTE addShortDescription;
DEALLOCATE PREPARE addShortDescription;

SET @stmt := (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE `products` ADD COLUMN `warranty` VARCHAR(255) NULL',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'warranty'
);
PREPARE addWarranty FROM @stmt;
EXECUTE addWarranty;
DEALLOCATE PREPARE addWarranty;
