import mongoose from 'mongoose';
import ChatMessage from '../models/ChatMessage.model.js';
import User from '../models/User.model.js';
import Shop from '../models/Shop.model.js';

// Get messages between current user and another user
export const getMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name avatar')
    .populate('receiver', 'name avatar');

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all conversations list for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id); // Convert to ObjectId for aggregation

    // Aggregate to find unique chat partners
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$message' },
          lastMessageTime: { $first: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiver', userId] },
                  { $eq: ['$read', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          'userDetails.name': 1,
          'userDetails.avatar': 1,
          'userDetails.role': 1
        }
      }
    ]);

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark conversation as read
export const markAsRead = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({ message: 'Invalid User ID' });
    }

    await ChatMessage.updateMany(
      { sender: otherUserId, receiver: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
