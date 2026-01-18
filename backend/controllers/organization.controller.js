import Organization from '../models/organization.js';
import User from '../models/user.js';
import {logger} from '../config/logger.js';
import Member from '../models/member.js';

export const createOrganization = async (req, res) => {
    try{
        const {name} = req.body;
        const userId = req.user._id;
        if(!name || !userId){
            return res.status(400).json({
                success: false,
                message: "Name and user ID are required"
            });
        }

      
        const userExistingOrg = await Organization.findOne({ owner: userId });
        if(userExistingOrg){
            return res.status(400).json({
                success: false,
                message: "You already have an organization. Each user can only have one organization."
            });
        }

        
        const existingOrg = await Organization.findOne({name: name.trim()});
        if(existingOrg){
            return res.status(400).json({
                success:false,
                message: "Organization with this name already exists"
            });
        }

        // Create organization
        const organization = new Organization({
            name: name.trim(),
            owner: userId,
            
          
        });
        await organization.save();
        
     
        const ownerMember = new Member({
            user: userId,
            organization: organization._id,
            role:'owner',
            status:true,
            project:null
            
        })

        await ownerMember.save();

        
        await User.findByIdAndUpdate(userId, {
            $push: { organisations: organization._id }
        });

        logger.info(`Organization created: ${organization.name} by user ${userId}`);
        return res.status(201).json({
            success: true,
            message: "Organization created successfully",
            data: organization
        });
    }
    catch(error){
        logger.error("Error creating organization", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

export const currentOrganization = async (req,res) => {
    try{
        const userId = req.user._id;
        
        // First, check if user owns an organization
        let organization = await Organization.findOne({owner: userId});
        
        // If user doesn't own an organization, check if they're a member of any organization
        if(!organization){
            const memberRecord = await Member.findOne({
                user: userId,
                status: true
            }).populate('organization');
            
            if(memberRecord && memberRecord.organization){
                organization = memberRecord.organization;
            }
        }
        
        if(!organization){
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            })
        }
        return res.status(200).json({
            success: true,
            data: organization
        })
    }
    catch(error){
        logger.error("Error getting current organization", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}

export const updateOrganization = async (req,res) => {
    try{
        const userId = req.user._id;
        const {name} = req.body;
        const {id} = req.params;
        

        const organization = await Organization.findById(id);
        if(!organization){
            return res.status(404).json({
                success: false,
                message: "Organization not found"
            })
        }
        if(organization.owner.toString() !== userId.toString()){
            return res.status(403).json({   
                success: false,
                message: "You are not authorized to update this organization"
            })
        }
        if(name){
            organization.name = name.trim();
        }
        await organization.save();
        logger.info(`Organization updated: ${organization.name}`);
        return res.status(200).json({
            success: true,
            message: "Organization updated successfully",
            data: organization
        })
    } 
    catch(error){
        logger.error("Error updating organization", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}