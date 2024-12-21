export class ErrorHandler extends Error {
    constructor(statusCode, message) {
      super(message);
      this.statusCode = statusCode;
  
      Error.captureStackTrace(this, this.constructor);
    }
  }

export const createError =(status, message)=>{
    const err = new Error()
    err.status = status, 
    err.message= message

    return err;
    //   this is like customizing or creating our own error with the error middleware
}