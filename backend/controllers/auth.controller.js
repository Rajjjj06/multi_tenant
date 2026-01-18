import User from '../models/user.js';
import {logger} from '../config/logger.js';
import {generateToken} from '../utils/jwt.js';
import {auth} from '../config/firebaseAdmin.js';

export const verifyFirebaseToken = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                message: "No token provided"
            });
        }

        // Verify Firebase token
        const decodedToken = await auth.verifyIdToken(idToken);

        // Extract user info from Firebase token (uid, not firebaseUid)
        const { uid, name, email, picture } = decodedToken;

        // Find user by firebaseUid (use uid from Firebase)
        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            // User exists - update their info
            user.email = email;
            user.name = name || user.name;
            // Always update avatar if picture exists, otherwise keep existing
            if (picture) {
                user.avatar = picture;
            }
            user.updatedAt = new Date();
            await user.save();
            logger.info(`User updated: ${user.email}`);
        } else {
            // New user - create in MongoDB
            user = new User({
                firebaseUid: uid,
                email: email,
                name: name || email.split('@')[0], // Use email prefix if no name
                avatar: picture || null, // Store picture as avatar
            });
            await user.save();
            logger.info(`New user created: ${user.email}`);
        }

        // Ensure avatar is returned (even if null)
        const userAvatar = user.avatar || null;

        // Generate JWT token
        const jwtToken = generateToken({
            userId: user._id.toString(),
            email: user.email
        });

        // Return user data and JWT token
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    avatar: userAvatar, // Use the ensured avatar value
                },
                token: jwtToken
            }
        });
    } catch (error) {
        logger.error("Error verifying Firebase token", error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                message: 'Firebase token has expired'
            });
        }
        
        if (error.code === 'auth/argument-error') {
            return res.status(400).json({
                success: false,
                message: 'Invalid Firebase token format'
            });
        }

        // Generic error response
        res.status(401).json({
            success: false,
            message: error.message || 'Failed to verify Firebase token'
        });
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        // User is already attached to req by authenticateUser middleware
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    email: req.user.email,
                    name: req.user.name,
                    avatar: req.user.avatar
                }
            }
        });
    } catch (error) {
        logger.error("Error getting current user", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}