import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Note, NotesContextType, NoteFormData } from '@/types';
import apiService from '@/services/api';

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

interface NotesProviderProps {
  children: ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const fetchNotes = async (params?: { page?: number; limit?: number; search?: string; tags?: string }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.getNotes(params);
      if (response.success && response.data) {
        setNotes(response.data.notes || []);
      } else {
        throw new Error(response.message || 'Failed to fetch notes');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch notes');
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async (data: NoteFormData): Promise<Note> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.createNote(data);
      if (response.success && response.data) {
        const newNote = response.data.note;
        setNotes(prev => [newNote, ...prev]);
        return newNote;
      } else {
        throw new Error(response.message || 'Failed to create note');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to create note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateNote = async (id: string, data: NoteFormData): Promise<Note> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.updateNote(id, data);
      if (response.success && response.data) {
        const updatedNote = response.data.note;
        setNotes(prev => prev.map(note => note.id === id ? updatedNote : note));
        if (selectedNote?.id === id) {
          setSelectedNote(updatedNote);
        }
        return updatedNote;
      } else {
        throw new Error(response.message || 'Failed to update note');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiService.deleteNote(id);
      if (response.success) {
        setNotes(prev => prev.filter(note => note.id !== id));
        if (selectedNote?.id === id) {
          setSelectedNote(null);
        }
      } else {
        throw new Error(response.message || 'Failed to delete note');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to delete note');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: NotesContextType = {
    notes,
    isLoading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    selectedNote,
    setSelectedNote,
  };

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};
