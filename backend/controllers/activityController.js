const Activity = require('../models/Activity');


exports.newTeacherActivity = async (teacherData) => {
    try {
        if (!teacherData.firstName) {
            throw new Error('Teacher name is required');
        }

        const activity = await Activity.create({
            type: 'teacher_registered',
            message: `New teacher ${teacherData.firstName} ${teacherData.lastName || ''} registered`,
            userId: teacherData._id,
            schoolCode: teacherData.schoolCode,
            metadata: {
                teacherName: `${teacherData.firstName} ${teacherData.lastName || ''}`.trim()
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create teacher activity:', err);
        return { success: false, error: err.message };
    }
};


exports.docCreatedActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, grade, stream, learningArea, docType, schoolCode, documentId } = activityData;
        
        if (!teacherName || !grade || !stream || !learningArea || !docType) {
            throw new Error('Missing required activity data');
        }

        const activity = await Activity.create({
            type: 'document_created',
            message: `${teacherName} created a ${docType} for ${grade} ${stream} - ${learningArea}`,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName,
                grade,
                stream,
                learningArea,
                docType,
                documentId
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create document activity:', err);
        return { success: false, error: err.message };
    }
};


exports.docDownloadedActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, docType, schoolCode, documentId } = activityData;
        
        if (!teacherName || !docType) {
            throw new Error('Missing required download activity data');
        }

        const activity = await Activity.create({
            type: 'document_downloaded',
            message: `${teacherName} downloaded a ${docType}`,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName,
                docType,
                documentId
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create download activity:', err);
        return { success: false, error: err.message };
    }
};


exports.getAllActivities = async (req, res) => {
    try {
        const { 
            schoolCode, 
            type, 
            limit = 10, 
            page = 1,
            userId 
        } = req.query;

        
        const query = {};
        if (schoolCode) query.schoolCode = schoolCode;
        if (type) query.type = type;
        if (userId) query.userId = userId;

        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const limitNum = Math.min(parseInt(limit), 50); 

        
        const activities = await Activity.find(query)
            .populate('userId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(); 

        
        const total = await Activity.countDocuments(query);

        
        const formattedActivities = activities.map(activity => ({
            _id: activity._id,
            type: activity.type,
            message: activity.message,
            user: activity.userId ? {
                id: activity.userId._id,
                name: activity.userId.firstName + ' ' + (activity.userId.lastName || '')
            } : null,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
            timeAgo: getTimeAgo(activity.createdAt)
        }));

        res.json({
            success: true,
            data: formattedActivities,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limitNum),
                count: formattedActivities.length,
                totalItems: total
            }
        });

    } catch (error) {
        console.error('Failed to fetch activities:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to load activities',
            message: error.message 
        });
    }
};


exports.getRecentActivities = async (req, res) => {
    try {
        const { schoolCode } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        if (!schoolCode) {
            return res.status(400).json({
                success: false,
                error: 'School code is required'
            });
        }

        const activities = await Activity.find({ schoolCode })
            .populate('userId', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        const formattedActivities = activities.map(activity => ({
            _id: activity._id,
            type: activity.type,
            message: activity.message,
            user: activity.userId ? {
                name: `${activity.userId.firstName} ${activity.userId.lastName || ''}`.trim()
            } : null,
            metadata: activity.metadata,
            createdAt: activity.createdAt,
            timeAgo: getTimeAgo(activity.createdAt)
        }));

        res.json({
            success: true,
            data: formattedActivities
        });

    } catch (error) {
        console.error('Failed to fetch recent activities:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load recent activities'
        });
    }
};


function getTimeAgo(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return new Date(date).toLocaleDateString();
}

exports.teacherAssignedClassActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, assignedClasses, schoolCode } = activityData;
        
        if (!teacherName || !assignedClasses || !Array.isArray(assignedClasses)) {
            throw new Error('Missing required class assignment data');
        }

        
        const classDescriptions = assignedClasses.map(cls => 
            `${cls.grade} ${cls.stream} - ${cls.learningArea}`
        ).join(', ');

        const activity = await Activity.create({
            type: 'teacher_assigned_class',
            message: `${teacherName} was assigned to ${assignedClasses.length} class(es): ${classDescriptions}`,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName,
                assignedGrades: assignedClasses.map(cls => cls.grade),
                assignedStreams: assignedClasses.map(cls => cls.stream),
                assignedLearningAreas: assignedClasses.map(cls => cls.learningArea),
                actionType: 'assigned'
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create class assignment activity:', err);
        return { success: false, error: err.message };
    }
};


exports.teacherRemovedClassActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, removedClass, schoolCode } = activityData;
        
        if (!teacherName || !removedClass) {
            throw new Error('Missing required class removal data');
        }

        const activity = await Activity.create({
            type: 'teacher_removed_class',
            message: `${teacherName} was removed from class: ${removedClass.grade} ${removedClass.stream} - ${removedClass.learningArea}`,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName,
                grade: removedClass.grade,
                stream: removedClass.stream,
                learningArea: removedClass.learningArea,
                actionType: 'removed'
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create class removal activity:', err);
        return { success: false, error: err.message };
    }
};


exports.docDownloadedActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, docType, schoolCode, documentId, grade, subject, learningArea } = activityData;
        
        if (!teacherName || !docType) {
            throw new Error('Missing required download activity data');
        }

        
        let message = `${teacherName} downloaded a ${docType}`;
        if (grade && subject) {
            message += ` for ${grade} - ${subject}`;
        } else if (grade && learningArea) {
            message += ` for ${grade} - ${learningArea}`;
        }

        const activity = await Activity.create({
            type: 'document_downloaded',
            message: message,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName,
                docType,
                documentId,
                grade: grade,
                subject: subject || learningArea,
                learningArea: learningArea
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create download activity:', err);
        return { success: false, error: err.message };
    }
};


exports.teacherLoginActivity = async (activityData) => {
    try {
        const { teacherName, teacherId, schoolCode } = activityData;
        
        const activity = await Activity.create({
            type: 'login',
            message: `${teacherName} logged into the system`,
            userId: teacherId,
            schoolCode: schoolCode,
            metadata: {
                teacherName
            }
        });

        return { success: true, activity };
    } catch (err) {
        console.error('Failed to create login activity:', err);
        return { success: false, error: err.message };
    }
};