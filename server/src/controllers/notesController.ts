import { Request, Response } from 'express';
import Note from '../models/Note';
import { APIResponse, Note as INote } from '../types';
import { AuthRequest } from '../middleware/auth';

export class NotesController {
  // Get all notes for authenticated user
  static async getNotes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10, search = '', tags = '' } = req.query;

      // Build query
      const query: any = { userId };

      // Add search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } }
        ];
      }

      // Add tags filter
      if (tags) {
        const tagArray = (tags as string).split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);
      const notes = await Note.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const totalNotes = await Note.countDocuments(query);

      const response: APIResponse = {
        success: true,
        data: {
          notes,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: totalNotes,
            totalPages: Math.ceil(totalNotes / Number(limit)),
          },
        },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get notes error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Get single note by ID
  static async getNoteById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const note = await Note.findOne({ _id: id, userId }).lean();

      if (!note) {
        const response: APIResponse = {
          success: false,
          message: 'Note not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: APIResponse = {
        success: true,
        data: { note },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Get note error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Create new note
  static async createNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { title, content, tags = [] } = req.body;
      const userId = req.user?.userId;

      const note = new Note({
        title,
        content,
        tags,
        userId,
      });

      await note.save();

      const response: APIResponse = {
        success: true,
        message: 'Note created successfully',
        data: { note },
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Create note error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Update note
  static async updateNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, tags = [] } = req.body;
      const userId = req.user?.userId;

      // Check if note exists and belongs to user
      const existingNote = await Note.findOne({ _id: id, userId });

      if (!existingNote) {
        const response: APIResponse = {
          success: false,
          message: 'Note not found',
        };
        res.status(404).json(response);
        return;
      }

      // Update the note
      const updatedNote = await Note.findByIdAndUpdate(
        id,
        { title, content, tags },
        { new: true }
      );

      const response: APIResponse = {
        success: true,
        message: 'Note updated successfully',
        data: { note: updatedNote },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Update note error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Delete note
  static async deleteNote(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deletedNote = await Note.findOneAndDelete({ _id: id, userId });

      if (!deletedNote) {
        const response: APIResponse = {
          success: false,
          message: 'Note not found',
        };
        res.status(404).json(response);
        return;
      }

      const response: APIResponse = {
        success: true,
        message: 'Note deleted successfully',
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Delete note error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }
}
