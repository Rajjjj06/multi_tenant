import Project from '../models/project.js';
import Organization from '../models/organization.js';
import {logger} from '../config/logger.js';
import Member from '../models/member.js';


export const createProject = async (req, res) => {
    try{
        const{name, description, organizationId} = req.body;
        const userId = req.user._id;
        if(!name || !organizationId || !userId){
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
        if(organization.owner.toString() !== userId.toString()){
            return res.status(403).json({
                message:"You are not authorized to create a project in this organization",
                success:false
            })
        }
        const project = new Project({
            name, description, organization: organizationId, createdBy: userId})
        await project.save();
        
        const projectOwner = new Member ({
            user:userId,
            organization: organizationId,
            project: project._id,
            role:'owner',
            status:true,
            addedBy:userId
        })

        await projectOwner.save();

        logger.info(`Project created: ${project.name} by user ${userId}`);
        return res.status(201).json({
            message:"Project created successfully",
            success:true,
            data:project
        })
    }
    catch(error){
        logger.error("Error creating project", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const getProjects = async(req,res) => {
    try{
        const userId =req.user._id;
        const organizationId = req.params.organizationId;
        if(!organizationId || ! userId){
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

        const isOwner = organization.owner.toString() === userId.toString();
        
        // Check if user is a member of the organization (either organization-level or project-level)
        const isMember = await Member.findOne({
            organization:organizationId,
            user:userId,
            status:true
        })

        if(!isOwner && !isMember){
            return res.status(403).json({
                message:"You are not authorized to access this organization",
                success:false
            })
        }

        const projects = await Project.find({organization:organizationId});
      
        logger.info(`Projects fetched for organization ${organizationId} by user ${userId}`);
        return res.status(200).json({
            success:true,
            data:projects
        })
    }
    catch(error){
        logger.error("Error getting projects", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}


export const updateProject = async(req,res) => {
    try {
        const userId = req.user._id;
        const projectId = req.params.projectId;
        const {name, description} = req.body;
        if( !projectId || !userId){
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
            message:"You are not authorized to update this project",
            success:false
        })
      }
        if(name){
            project.name = name.trim();
        }
        if(description){
            project.description = description.trim();
        }
        await project.save();
        logger.info(`Project updated: ${project.name} by user ${userId}`);
        return res.status(200).json({
            success:true,
            message:"Project updated successfully",
            data:project
        })
    } catch (error) {
        logger.error("Error updating project", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}


export const deleteProject = async(req,res) => {
    try {
        const userId = req.user._id;
        const projectId = req.params.projectId;
     
        if( !projectId || !userId){
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
            message:"You are not authorized to delete this project",
            success:false
        })
      }
       
        await project.deleteOne();
        await Member.deleteMany({project:projectId});
        logger.info(`Project deleted: ${project.name} by user ${userId}`);
        return res.status(200).json({
            success:true,
            message:"Project deleted successfully",
            data:project
        })
       
       
       
    } catch (error) {
        logger.error("Error deleting project", error);
        return res.status(500).json({
            success:false,
            message:"Internal server error"
        })
    }
}