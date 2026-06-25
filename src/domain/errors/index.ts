export class DomainError extends Error {
  constructor(public message: string, public code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class GeofenceViolationError extends DomainError {
  constructor(message = 'Anda diluar jangkauan proyek.') {
    super(message, 'GEOFENCE_VIOLATION');
  }
}

export class TaskAlreadyLockedError extends DomainError {
  constructor(message = 'Target pekerjaan ini sudah dikunci dan tidak bisa diubah.') {
    super(message, 'TASK_LOCKED');
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} tidak ditemukan.`, 'NOT_FOUND');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Anda tidak memiliki akses.') {
    super(message, 'UNAUTHORIZED');
  }
}
