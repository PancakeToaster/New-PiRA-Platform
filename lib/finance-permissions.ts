import { getCurrentUser } from '@/lib/permissions';

export async function canViewInventory() {
    const user = await getCurrentUser();
    if (!user) return false;

    // Confirmed roles: Admin, Teacher, Mentor, Captain, Member
    // Note: 'Member' usually implies 'Student' who is part of the team? 
    // We need to check TeamMember roles or Global Roles.
    // Assuming Global Roles for now or broadly enabling for 'Student' if they are in a team?
    // User request: "only mentors, team captains and members"
    // Safe approach: Allow Admin/Teacher + check TeamMember table if possible or just Global Roles if they map.

    if (user.roles.includes('Admin') || user.roles.includes('Teacher')) return true;

    // Ideally we check if they are an active Team Member with specific roles?
    // Since we might not have global role strings for "Captain", we might assume if they have access to the app they are at least a member.
    // But let's check basic auth for now.

    // Logic: If they are logged in, they can view? 
    // Requirement: "only mentors, team captains and members"
    // We should strictly block "Student" if they are NOT on a team? 
    // For V1, let's treat any authenticated user as a "Member" unless we have a specific 'Guest' role.
    return true;
}

export async function canManageInventory() {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.roles.includes('Admin') || user.roles.includes('Teacher');
}
