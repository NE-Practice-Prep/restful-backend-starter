-- Add firstName / lastName and migrate from legacy name column
ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

UPDATE "User"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN TRIM("name")) > 0 THEN TRIM(SUBSTRING(TRIM("name") FROM 1 FOR POSITION(' ' IN TRIM("name")) - 1))
    ELSE TRIM("name")
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN TRIM("name")) > 0 THEN TRIM(SUBSTRING(TRIM("name") FROM POSITION(' ' IN TRIM("name")) + 1))
    ELSE ''
  END;

ALTER TABLE "User" DROP COLUMN "name";
