export const _401 = {
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    message: 'The credentials are not valid',
  },
  ACCESS_DENIED: {
    code: 'ACCESS_DENIED',
    message:
      'You are not allowed to do this operation nor access this endpoint',
  },
};
export const _400 = {
  // this is bad request

  BAD_FILE_FORMAT: {
    code: 'BAD_REQUEST',
    message: 'You are uploading a file that is not supported ',
  },

  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    message: 'The file is too large',
  },

  MISSING_FILES: {
    code: 'MISSING_FILES',
    message:
      'You need to upload supporting documentation to have access to this service',
  },
};

export const _403 = {
  USER_EXISTS_ALREADY: {
    code: 'USER_EXISTS_ALREADY',
    message: 'This means that the user does not exists',
  },
};

export const _404 = {
  NO_USER_FOUND: {
    code: 'NO_USER_FOUND',
    message: 'This means that the user does not exists',
  },
};

export const _500 = {
  DEFAULT_500: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'The service is currently not available',
  },
};
