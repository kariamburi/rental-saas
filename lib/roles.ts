export const Roles = {
    SUPER_ADMIN: "SUPER_ADMIN",
    COMPANY_ADMIN: "COMPANY_ADMIN",
    MANAGER: "MANAGER",
    ACCOUNTANT: "ACCOUNTANT",
    CARETAKER: "CARETAKER",
    VIEWER: "VIEWER",
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

export const companyStaffRoles = [
    Roles.MANAGER,
    Roles.ACCOUNTANT,
    Roles.CARETAKER,
    Roles.VIEWER,
];

export const companyAdminRoles = [
    Roles.COMPANY_ADMIN,
    Roles.MANAGER,
    Roles.ACCOUNTANT,
    Roles.CARETAKER,
    Roles.VIEWER,
];