export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  response: T | null; // Cho phép response là null
}

export class ApiResponseBuilder<T = any> {
  private message: string;
  private response: T | null;
  private success: boolean;

  constructor() {
    this.message = 'Operation completed successfully';
    this.response = null;
    this.success = true;
  }

  setMessage(message?: string): ApiResponseBuilder<T> {
    this.message = message || this.message;
    return this;
  }

  setResponse(data: T): ApiResponseBuilder<T> {
    this.response = data;
    return this;
  }

  setError(message?: string, error?: any): ApiResponseBuilder<T> {
    this.message = message || 'An error occurred';
    this.response = error || null;
    this.success = false;
    return this;
  }

  build(): ApiResponse<T> {
    return {
      success: this.success,
      message: this.message,
      response: this.response,
    };
  }
}

export const api = <T = any>() => new ApiResponseBuilder<T>();