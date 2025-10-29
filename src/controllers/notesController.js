import { Note } from '../models/note.js';
import createHttpError from 'http-errors';

export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;
    const { _id: userId } = req.user;

    const filter = { userId };

    if (tag) filter.tag = tag;
    if (search) filter.$text = { $search: search };

    const totalNotes = await Note.countDocuments(filter);
    const totalPages = Math.ceil(totalNotes / perPage);

    const notes = await Note.find(filter)
      .skip((page - 1) * perPage)
      .limit(Number(perPage))
      .sort({ createdAt: -1 });

    res.status(200).json({
      page: Number(page),
      perPage: Number(perPage),
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) throw createHttpError(404, 'Note not found');

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    const note = await Note.create({ ...req.body, userId });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId },
      req.body,
      { new: true },
    );

    if (!note) throw createHttpError(404, 'Note not found');
    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const { _id: userId } = req.user;

    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) throw createHttpError(404, 'Note not found');

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
