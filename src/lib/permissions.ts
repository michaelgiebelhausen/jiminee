// FR-002 permission matrix — encoded once, used by route guards and component-level checks.
// RLS is the authoritative enforcement; this keeps the UI honest and in sync.

export type Role = "manager" | "administrator" | "worker";

export type Action =
  | "createTask"
  | "editAnyTask"
  | "claimTask"
  | "checkSteps"
  | "flagDispute"
  | "ruleDispute"
  | "viewDashboard"
  | "manageOrg"
  | "inviteMembers"
  | "chaseTask"
  | "resolveCorrection";

const MATRIX: Record<Action, Role[]> = {
  createTask: ["manager", "administrator"],
  editAnyTask: ["manager", "administrator"],
  claimTask: ["worker"],
  checkSteps: ["worker"],
  flagDispute: ["worker"],
  ruleDispute: ["administrator"],
  viewDashboard: ["manager", "administrator"],
  manageOrg: ["administrator"],
  inviteMembers: ["administrator"],
  chaseTask: ["manager", "administrator"],
  resolveCorrection: ["manager", "administrator"],
};

export function can(role: Role | null | undefined, action: Action): boolean {
  if (!role) return false;
  return MATRIX[action].includes(role);
}
