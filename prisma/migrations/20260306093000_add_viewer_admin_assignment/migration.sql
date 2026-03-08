-- Create table to assign each viewer to one responsible admin
CREATE TABLE "ViewerAdminAssignment" (
    "id" TEXT NOT NULL,
    "viewerId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ViewerAdminAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ViewerAdminAssignment_viewerId_key" ON "ViewerAdminAssignment"("viewerId");
CREATE INDEX "ViewerAdminAssignment_adminId_idx" ON "ViewerAdminAssignment"("adminId");

ALTER TABLE "ViewerAdminAssignment"
ADD CONSTRAINT "ViewerAdminAssignment_viewerId_fkey"
FOREIGN KEY ("viewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ViewerAdminAssignment"
ADD CONSTRAINT "ViewerAdminAssignment_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

