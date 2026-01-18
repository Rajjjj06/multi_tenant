import Task from '../models/task.js';
import {logger} from '../config/logger.js';
import Project from '../models/project.js';
import Organization from '../models/organization.js';
import Member from '../models/member.js';
import User from '../models/user.js';

export const createTask = async (req,res) => {
    try {
        const userId = req.user._id;
        const {name, projectId, organizationId, memberIds, description} = req.body;
        if(!name || !projectId || !organizationId || !userId){
            return res.status(400).json({
                message:"Something is wrong with the request",
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
        const organization = await Organization.findById(organizationId);
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
                message:"You are not authorized to create a task in this project",
                success:false
            })
        }

        // Get all members from the project
        const allMembers = await Member.find({organization:organizationId, project:projectId, status:true});
        if(allMembers.length === 0){
            return res.status(404).json({
                message:"No members found for this project",
                success:false
            })
        }

        let membersToAssign = [];

        // If memberIds are provided, validate and use them
        if(memberIds && Array.isArray(memberIds) && memberIds.length > 0){
            // Validate that all provided memberIds belong to this project
            const providedMemberIds = memberIds.map(id => id.toString());
            const validMembers = allMembers.filter(m => 
                providedMemberIds.includes(m._id.toString())
            );

            if(validMembers.length !== memberIds.length){
                return res.status(400).json({
                    message:"Some member IDs are invalid or don't belong to this project",
                    success:false
                })
            }

            membersToAssign = validMembers.map(m => m._id);
        } else {
            // If no memberIds provided, assign all members (backward compatibility)
            membersToAssign = allMembers.map(m => m._id);
        }

        const task = new Task({
            name, 
            project:projectId, 
            organization:organizationId, 
            user:userId, 
            member:membersToAssign,
            description
        })
        await task.save();
        logger.info(`Task created: ${task.name} by user ${userId}`);
        return res.status(201).json({
            message:"Task created successfully",
            success:true,
            data:task
        })
        
    } catch (error) {
        logger.error("Error creating task", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const updateTaskStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['todo', 'in-progress', 'done'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be one of: todo, in-progress, done",
                success: false
            });
        }

        // Find the task
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({
                message: "Task not found",
                success: false
            });
        }

        // Find the member record for this user in the task's organization and project
        const member = await Member.findOne({
            user: userId,
            organization: task.organization,
            project: task.project,
            status: true
        });

        if (!member) {
            return res.status(403).json({
                message: "You are not a member of this project",
                success: false
            });
        }

        // Check if this member is assigned to the task
        const isAssignedToTask = task.member.some(
            memberId => memberId.toString() === member._id.toString()
        );

        if (!isAssignedToTask) {
            return res.status(403).json({
                message: "You are not assigned to this task. Only assigned members can update task status",
                success: false
            });
        }

        // Update the task status
        task.status = status;
        await task.save();

        logger.info(`Task status updated: ${task.name} to ${status} by user ${userId}`);
        return res.status(200).json({
            message: "Task status updated successfully",
            success: true,
            data: task
        });

    } catch (error) {
        logger.error("Error updating task status", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const getTasks = async (req,res) => {
    try {
        const userId = req.user._id;
        const { organizationId, projectId } = req.params;
        if(!organizationId || !projectId || !userId){
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
        const tasks = await Task.find({organization:organizationId, project:projectId});
        logger.info(`Tasks fetched for project ${projectId} by user ${userId}`);
        return res.status(200).json({
            success:true,
            data:tasks
        })
    } catch (error) {
        logger.error("Error getting tasks", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const deleteTask = async (req,res) => {
    try {
        const userId = req.user._id;
        const { taskId } = req.params;
        if(!taskId || !userId){
            return res.status(400).json({
                message:"Something is wrong with the request",
                success:false
            })
        }
        const task = await Task.findById(taskId);
        if(!task){
            return res.status(404).json({
                message:"Task not found",
                success:false
            })
        }
        await task.deleteOne();
        logger.info(`Task deleted: ${task.name} by user ${userId}`);
        return res.status(200).json({
            message:"Task deleted successfully",
            success:true,
            data:task
        })
    }
    catch (error) {
        logger.error("Error deleting task", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}