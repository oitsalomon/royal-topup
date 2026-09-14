export const ADMIN_COOKIE_NAME = 'admin_session'
export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'STAFF', 'CS', 'VIEWER'] as const
export type AdminRole = (typeof ADMIN_ROLES)[number]

export const isAdminRole = (role?: string | null): role is AdminRole => {
    return !!role && (ADMIN_ROLES as readonly string[]).includes(role)
}
