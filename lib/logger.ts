/**
 * Structured logging utility
 * In production, this can be replaced with Winston, Pino, or sent to logging services
 */

import { isDevelopment, isProduction } from "./config";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    this.minLevel = isProduction() ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const base = `[${timestamp}] [${level}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      return `${base} ${JSON.stringify(context)}`;
    }

    return base;
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    if (isDevelopment()) {
      console.log(this.formatMessage("DEBUG", message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage("INFO", message, context));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage("WARN", message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext: LogContext = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    } else if (error) {
      errorContext.error = error;
    }

    console.error(this.formatMessage("ERROR", message, errorContext));
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    path: string,
    ip: string,
    context?: LogContext
  ): void {
    this.info("API Request", {
      method,
      path,
      ip,
      ...context,
    });
  }

  /**
   * Log API response
   */
  logResponse(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    context?: LogContext
  ): void {
    this.info("API Response", {
      method,
      path,
      statusCode,
      durationMs,
      ...context,
    });
  }

  /**
   * Log external API call
   */
  logExternalAPI(
    provider: string,
    success: boolean,
    durationMs: number,
    context?: LogContext
  ): void {
    const level = success ? "info" : "warn";
    this[level]("External API Call", {
      provider,
      success,
      durationMs,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
