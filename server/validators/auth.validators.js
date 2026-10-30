const { z } = require('zod');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(72, 'Password must be at most 72 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z.string().trim().toLowerCase().email('Please provide a valid email address');

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must be at least 2 characters long')
      .max(100, 'Full name must be at most 100 characters long'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['CLIENT', 'RECRUITER'], {
      errorMap: () => ({ message: 'Role must be either CLIENT or RECRUITER' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resetPasswordParamsSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

const resetPasswordBodySchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

const verifyEmailParamsSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordParamsSchema,
  resetPasswordBodySchema,
  changePasswordSchema,
  verifyEmailParamsSchema,
};
