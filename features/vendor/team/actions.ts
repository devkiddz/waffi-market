'use server';

import { revalidatePath } from 'next/cache';

import { requireVendorPermission } from '@/features/vendor/auth/vendorAccess';
import { prisma } from '@/lib/prisma';

const text=(data:FormData,key:string)=>String(data.get(key)??'').trim();

export async function addVendorTeamMember(formData:FormData){const access=await requireVendorPermission('team:manage');const email=text(formData,'email').toLowerCase();const requested=text(formData,'role');const role=(['MANAGER','EDITOR','ANALYST'].includes(requested)?requested:'EDITOR') as 'MANAGER'|'EDITOR'|'ANALYST';if(!email)throw new Error('A team member email is required.');const user=await prisma.user.findUnique({where:{email},select:{id:true,name:true,isGhostDeveloper:true,accountState:true}});if(!user||user.isGhostDeveloper||user.accountState!=='ACTIVE')throw new Error('The team member must have an active normal Shelsea account.');await prisma.vendorMembership.upsert({where:{vendorId_userId:{vendorId:access.vendor.id,userId:user.id}},update:{role,active:true},create:{vendorId:access.vendor.id,userId:user.id,role,active:true}});await prisma.adminAuditEvent.create({data:{workspaceId:access.workspace.id,actorId:access.session.user.id,action:'VENDOR_TEAM_MEMBER_ADDED',targetType:'VENDOR',targetId:access.vendor.id,summary:`${user.name} joined ${access.vendor.name} as ${role}.`,metadata:{userId:user.id,role}}});revalidatePath('/vendor/team');revalidatePath('/admin/vendors');}

export async function updateVendorTeamMember(formData:FormData){const access=await requireVendorPermission('team:manage');const membershipId=text(formData,'membershipId');const requested=text(formData,'role');const active=text(formData,'active')==='true';const role=(['MANAGER','EDITOR','ANALYST'].includes(requested)?requested:'EDITOR') as 'MANAGER'|'EDITOR'|'ANALYST';const membership=await prisma.vendorMembership.findFirst({where:{id:membershipId,vendorId:access.vendor.id,role:{not:'OWNER'}},select:{id:true}});if(!membership)throw new Error('The team membership is unavailable or protected.');await prisma.vendorMembership.update({where:{id:membership.id},data:{role,active}});revalidatePath('/vendor/team');}
