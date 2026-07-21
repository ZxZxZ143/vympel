export function hasAdminRole(roles: readonly string[]) {
  return roles.includes("ADMIN");
}

export function canAccessProtectedRoute(roles: readonly string[], adminOnly: boolean) {
  return !adminOnly || hasAdminRole(roles);
}

export function canViewNavigationItem(roles: readonly string[], adminOnly = false) {
  return canAccessProtectedRoute(roles, adminOnly);
}
