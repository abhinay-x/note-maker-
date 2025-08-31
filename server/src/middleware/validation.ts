import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { APIResponse, ValidationError } from '../types';

export const validateSignup = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string()
      .min(8)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        'any.required': 'Password is required',
      }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required',
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateOTP = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'OTP must be exactly 6 digits',
      'string.pattern.base': 'OTP must contain only numbers',
      'any.required': 'OTP is required',
    }),
    // Allow tempData from signup flow so validation doesn't fail on unknown field
    tempData: Joi.any().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
    newPassword: Joi.string().min(8).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  next();
};

export const validateNote = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    title: Joi.string().min(1).max(255).required().messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required',
    }),
    content: Joi.string().min(1).required().messages({
      'string.min': 'Content cannot be empty',
      'any.required': 'Content is required',
    }),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]).messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.max': 'Each tag cannot exceed 50 characters',
    }),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));

    const response: APIResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    res.status(400).json(response);
    return;
  }

  req.body = value;
  next();
};
