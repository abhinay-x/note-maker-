import React from 'react';
import { motion } from 'framer-motion';
import { Edit3, Trash2, Calendar, Tag } from 'lucide-react';
import { Note } from '@/types';
import { useNotes } from '@/context/NotesContext';

interface NoteCardProps {
  note: Note;
  viewMode: 'grid' | 'list';
  onEdit: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, viewMode, onEdit }) => {
  const { deleteNote } = useNotes();

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(note.id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-4"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {note.title}
            </h3>
            <p className="text-gray-600 mb-3 line-clamp-2">
              {truncateContent(note.content, 150)}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(note.updated_at)}
              </div>
              {note.tags.length > 0 && (
                <div className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  <span>{note.tags.length} tag{note.tags.length === 1 ? '' : 's'}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 p-6 cursor-pointer group"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
          {note.title}
        </h3>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {truncateContent(note.content, 120)}
      </p>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {note.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            >
              {tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{note.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <Calendar className="w-3 h-3 mr-1" />
          {formatDate(note.updated_at)}
        </div>
        <div className="flex items-center space-x-3">
          {note.tags.length > 0 && (
            <div className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {note.tags.length}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NoteCard;
