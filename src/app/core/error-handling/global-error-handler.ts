import { ErrorHandler, Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AppError } from '../../shared/models/app-error';
import { NotificationService } from '../services/notification.service';

/**
 * Logs the error name, message and (outside production) stack so useful context is kept, and
 * tells the user something went wrong. Error objects are not dumped wholesale, because they
 * could carry request or patient data.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly notifications = inject(NotificationService);

  handleError(error: unknown): void {
    if (error instanceof Error) {
      console.error(`[${error.name}] ${error.message}`, environment.production ? '' : error.stack);
    } else {
      console.error('[UnknownError] A non-error value was thrown.');
    }
    // Domain errors are already surfaced by the screen that triggered them.
    if (!(error instanceof AppError)) {
      this.notifications.error('Something went wrong. Please try again or reload the page.');
    }
  }
}
