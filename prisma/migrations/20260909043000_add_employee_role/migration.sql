-- Additive: preserve existing USER, ADMIN and ENTREPRENEUR accounts.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'EMPLOYEE';
