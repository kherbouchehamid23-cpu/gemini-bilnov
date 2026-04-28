// Plan limits
export const PLAN_LIMITS = {
  TRIAL: {
    maxProjects: 1,
    maxStorageBytes: 1 * 1024 * 1024 * 1024,
    maxGenerations3d: 2,
    maxActiveTours: 1,
    maxMembersPerProject: 3,
    maxAccessCodes: 2,
  },
  STARTER: {
    maxProjects: 3,
    maxStorageBytes: 10 * 1024 * 1024 * 1024,
    maxGenerations3d: 5,
    maxActiveTours: 3,
    maxMembersPerProject: 5,
    maxAccessCodes: 3,
  },
  PRO: {
    maxProjects: 10,
    maxStorageBytes: 50 * 1024 * 1024 * 1024,
    maxGenerations3d: 30,
    maxActiveTours: 10,
    maxMembersPerProject: 20,
    maxAccessCodes: 15,
  },
  ENTERPRISE: {
    maxProjects: Infinity,
    maxStorageBytes: Infinity,
    maxGenerations3d: Infinity,
    maxActiveTours: Infinity,
    maxMembersPerProject: Infinity,
    maxAccessCodes: Infinity,
  },
} as const;

// Error codes
export enum ErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PLAN_LIMIT_REACHED = 'PLAN_LIMIT_REACHED',
  NOT_FOUND = 'NOT_FOUND',
  ACCESS_CODE_EXPIRED = 'ACCESS_CODE_EXPIRED',
  ACCESS_CODE_REVOKED = 'ACCESS_CODE_REVOKED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_360_RATIO = 'INVALID_360_RATIO',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
}

// File type allowed MIME types
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  IMAGE_360: ['image/jpeg', 'image/png'],
  PDF: ['application/pdf'],
  DWG: ['application/acad', 'image/vnd.dwg', 'application/octet-stream'],
  DXF: ['application/dxf', 'image/vnd.dxf', 'text/plain'],
  OBJ: ['text/plain', 'application/obj', 'model/obj'],
  GLB: ['model/gltf-binary', 'application/octet-stream'],
  GLTF: ['model/gltf+json', 'application/json'],
  IFC: ['application/x-step', 'application/octet-stream'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  OTHER: [],
};

// Max file sizes in bytes
export const MAX_FILE_SIZES: Record<string, number> = {
  IMAGE_360: 50 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
  DEFAULT: 20 * 1024 * 1024,
};
