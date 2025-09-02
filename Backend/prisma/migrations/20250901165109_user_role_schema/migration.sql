-- CreateTable
CREATE TABLE "public"."Users" (
    "UserID" SERIAL NOT NULL,
    "Username" VARCHAR(20) NOT NULL,
    "Email" VARCHAR(255) NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "DateDeleted" TIMESTAMP(3),
    "DateModified" TIMESTAMP(3) NOT NULL,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "public"."Roles" (
    "RoleID" SERIAL NOT NULL,
    "RoleName" VARCHAR(20) NOT NULL,
    "Description" TEXT,
    "PermissionID" JSONB,
    "DateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DateModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roles_pkey" PRIMARY KEY ("RoleID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "public"."Users"("Email");
