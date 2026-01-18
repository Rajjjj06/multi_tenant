import Member from '../models/member.js';
import {logger} from '../config/logger.js';
import Project from '../models/project.js';
import Organization from '../models/organization.js';
import User from '../models/user.js';

export const addMember = async(req,res) => {
    try {
        const userId = req.user._id;
        const {organizationId, projectId} = req.params;
        const {email, role} = req.body;
        if(!email || !role || !projectId || !userId || !organizationId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        const validRoles = ['owner', 'member', 'viewer'];
        if(!validRoles.includes(role)){
            return res.status(400).json({
                message: "Invalid role. Must be one of: owner, member, viewer",
                success: false
            })
        }
        
        const project = await Project.findById(projectId);
        if(!project){
            return res.status(404).json({
                message:"Project not found",
                success:false
            })
        }
        const organization = await Organization.findById(project.organization);
        if(!organization){
            return res.status(404).json({
                message:"Organization not found",
                success:false
            })
        }
        const isOwner = organization.owner.toString() === userId.toString();
        const isProjectCreator = project.createdBy.toString() === userId.toString();
        if(!isOwner && !isProjectCreator){
            return res.status(403).json({
                message:"You are not authorized to add a member to this project",
                success:false
            })
        }
        let user = await User.findOne({email: email.trim()});
        
        // If user doesn't exist, create a placeholder user
        // (In production, you might want to use an invitation system instead)
        if(!user){
            user = new User({
                email: email.trim(),
                name: email.split('@')[0], // Use email prefix as name
                // firebaseUid will be null - user can update it when they register
            });
            await user.save();
            logger.info(`Placeholder user created: ${user.email}`);
        }
        const isMember = await Member.findOne({organization:organization._id, user:user._id, project:project._id, status:true});
        if(isMember){
            return res.status(400).json({
                message:"User is already a member of this project",
                success:false
            })
        }
        const newMember = new Member({
            user:user._id,
            organization:organization._id,
            project:project._id,
            role:role,
            status:true,
            addedBy:userId
        })
        await newMember.save();
        logger.info(`Member added to project: ${project.name} by user ${userId}`);
        return res.status(200).json({
            success:true,
            message:"Member added to project successfully",
            data:newMember
        })
    } catch (error) {
        logger.error("Error adding member", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
        
    }
}

export const getMembers = async(req,res) =>{
    try {
        const userId = req.user._id;
        const organizationId = req.params.organizationId;
        const projectId = req.params.projectId;
        if(!organizationId || !userId || !projectId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        const organization = await Organization.findById(organizationId);
        const project = await Project.findById(projectId);
        if(!organization || !project){
            return res.status(404).json({
                message:"Organization or project not found",
                success:false
            })
        }
        const isOwner = organization.owner.toString() === userId.toString();
        const isProjectCreator = project.createdBy.toString() === userId.toString();
        const isMember = await Member.findOne({organization:organizationId, user:userId, project:projectId, status:true});
        if(!isOwner && !isProjectCreator && !isMember){
            return res.status(403).json({
                message:"You are not authorized to get members of this project",
                success:false
            })
        }
        const members = await Member.find({organization:organizationId, project:projectId, status:true})
            .populate('user', 'name email avatar')
            .populate('addedBy', 'name email');
        
        logger.info(`Members fetched for project ${projectId} by user ${userId}`);
        return res.status(200).json({
            success:true,
            data:members
        });
    } catch (error) {
        logger.error("Error getting members", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const deleteMember = async(req,res) => {
    try {
        const userId = req.user._id;
        const organizationId = req.params.organizationId;
        const projectId = req.params.projectId;
        const memberId = req.params.memberId;
        if(!organizationId || !userId || !projectId || !memberId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        const organization = await Organization.findById(organizationId);
        if(!organization){
            return res.status(404).json({
                message:"Organization not found",
                success:false
            })
        }
        const project = await Project.findById(projectId);
        if(!project){
            return res.status(404).json({
                message:"Project not found",
                success:false
            })
        }

        if(project.organization.toString() !== organizationId.toString()){
            return res.status(403).json({
                message:"Project does not belong to the organization",
                success:false
            })
        }

    

        const member = await Member.findById(memberId).populate('user', 'name email');
        if(!member){
            return res.status(404).json({
                message:"Member not found",
                success:false
            })
        }
        
        // Verify member belongs to this project and organization
        if(member.organization.toString() !== organizationId.toString() || 
           member.project.toString() !== projectId.toString()){
            return res.status(400).json({
                message:"Member does not belong to this project",
                success: false
            })
        }
        
        // Check authorization: Organization owner OR Project creator can delete
        const isOwner = organization.owner.toString() === userId.toString();
        const isProjectCreator = project.createdBy.toString() === userId.toString();
        
        if(!isOwner && !isProjectCreator){
            return res.status(403).json({
                message:"You are not authorized to delete this member",
                success:false
            })
        }

        // Prevent deleting project owner (member with role 'owner')
        if(member.role === 'owner'){
            return res.status(403).json({
                message:"Cannot delete project owner",
                success:false
            })
        }
        
        // Prevent deleting yourself
        if(member.user._id.toString() === userId.toString()){
            return res.status(403).json({
                message:"You cannot delete yourself",
                success:false
            })
        }
        const memberName = member.user?.name || member.user?.email || 'Unknown';
        await member.deleteOne();
        logger.info(`Member ${memberName} deleted from project ${project.name} by user ${userId}`);
        return res.status(200).json({
            success:true,
            message:"Member deleted successfully",
            data:member
        })
    } catch (error) {
        logger.error("Error deleting member", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}


export const getOrganizationMembers = async(req,res) => {
    try {
        const userId = req.user._id;
        const organizationId = req.params.organizationId;
        
        if(!organizationId || !userId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        
        const organization = await Organization.findById(organizationId);
        if(!organization){
            return res.status(404).json({
                message:"Organization not found",
                success:false
            })
        }
        
        // Check if user is owner or member of the organization
        const isOwner = organization.owner.toString() === userId.toString();
        const isMember = await Member.findOne({
            organization:organizationId,
            user:userId,
            status:true
        });
        
        if(!isOwner && !isMember){
            return res.status(403).json({
                message:"You are not authorized to access this organization",
                success:false
            })
        }
        
        // Get all members of the organization (across all projects, including organization-level)
        const members = await Member.find({
            organization:organizationId,
            status:true
        })
        .populate('user', 'name email avatar')
        .populate('addedBy', 'name email')
        .populate('project', 'name');
        
        // Group members by user to get unique users (since a user can be in multiple projects)
        // We'll take the highest role if user has multiple roles
        const uniqueMembers = new Map();
        
        members.forEach(member => {
            const userIdStr = member.user._id.toString();
            if(!uniqueMembers.has(userIdStr)){
                uniqueMembers.set(userIdStr, {
                    _id: member._id,
                    user: member.user,
                    role: member.role,
                    status: member.status,
                    addedBy: member.addedBy,
                    addedAt: member.addedAt,
                    organization: member.organization,
                    project: member.project,
                    projects: [] // List of all projects this user is in
                });
            }
            
            // Add project to the user's projects list
            const existingMember = uniqueMembers.get(userIdStr);
            if(member.project){
                existingMember.projects.push({
                    _id: member.project._id,
                    name: member.project.name
                });
            }
            
            // Use highest role (owner > member > viewer)
            const rolePriority = {owner: 3, member: 2, viewer: 1};
            if(rolePriority[member.role] > rolePriority[existingMember.role]){
                existingMember.role = member.role;
            }
        });
        
        const membersArray = Array.from(uniqueMembers.values());
        
        logger.info(`Organization members fetched for organization ${organizationId} by user ${userId}`);
        return res.status(200).json({
            success:true,
            data:membersArray
        });
    } catch (error) {
        logger.error("Error getting organization members", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const updateMember = async(req,res) => {
    try {
        const userId = req.user._id;
        const organizationId = req.params.organizationId;
        const projectId = req.params.projectId;
        const memberId = req.params.memberId;
        const {email, name, role, status} = req.body;
        
        if(!organizationId || !userId || !projectId || !memberId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        const organization = await Organization.findById(organizationId);
        if(!organization){
            return res.status(404).json({
                message:"Organization not found",
                success:false
            })
        }
        const project = await Project.findById(projectId);
        if(!project){
            return res.status(404).json({
                message:"Project not found",
                success:false
            })
        }
        const member = await Member.findById(memberId).populate('user', 'name email');
        if(!member){
            return res.status(404).json({
                message:"Member not found",
                success:false
            })
        }
        const isOwner = organization.owner.toString() === userId.toString();
        const isProjectCreator = project.createdBy.toString() === userId.toString();
        if(!isOwner && !isProjectCreator){
            return res.status(403).json({
                message:"You are not authorized to update this member",
                success:false
            })
        }
     if (role){
        const validRoles = ['owner', 'member', 'viewer'];
        if(!validRoles.includes(role)){
            return res.status(400).json({
                message:"Invalid role. Must be one of: owner, member, viewer",
                success:false
            })
        }
        member.role = role;
     }

     if (status !== undefined){
        member.status = status;
     }
     await member.save();

     const userUpdateData ={};
     if (name){
        userUpdateData.name = name.trim();
     }
     if(email){
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email.trim())){
            return res.status(400).json({
                message: "Invalid email format",
                success: false
            })
        }
        userUpdateData.email = email.trim();
    }
     if (Object.keys(userUpdateData).length > 0){
        await User.findByIdAndUpdate(member.user._id, userUpdateData);
        await member.populate('user', 'name email');
     }
     
     logger.info(`Member updated: ${member.user.name || member.user.email} in project ${project.name} by user ${userId}`);
        return res.status(200).json({
            success: true,
            message: "Member updated successfully",
            data: member
     })
    } catch (error) {
        logger.error("Error updating member", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}