import { PermissionReading } from "./permission-reading.entity";

const MOCK_PERMISSION_READS: PermissionReading[] = [
  {
    permissionToken: "i_have_read_permissions_RpMFWVAmFPOSvrByDEYgs",
    permissionExpirationMinutes: 5,
    permissions: ["buy supplies for office"],
  },
];

export const getPermissionReadingByToken = async (
  permissionToken: string
): Promise<PermissionReading | null> => {
  return (
    MOCK_PERMISSION_READS.find(
      (perm) => perm.permissionToken === permissionToken
    ) ?? null
  );
};
