
export default (err, req, res, next)=>{
    const errStatus =err.status || 500
    const errMessage =err.message || 'Something went wrong'

    if(process.env.NODE_ENV === 'development'){
        res.status(errStatus).json({
            success:false,
            error:err,
            message:errMessage,
            stack:err.stack
        })
    }

    if (err.name === "CastError") {
        const message = `Resource not found. Invalid: ${err?.path}`;
        return res.status(404).json({
          success: false,
          message: message,
        });
      }
    
      if (err.name === "ValidationError") {
        const message = Object.values(err.errors).map((value) => value.message);
        // to tap into an object, there are two properties, the key and the values,
        // so here we are taping into the values(which is errors:[{}] i.e the key is errors and the values is an array off obj)
        return res.status(400).json({
          success: false,
          message: message,
        });
      }

      // Handle mongoose duplicate key error
      if(err.code === 1000){
        const message =`Duplicate ${Object.keys(err.keyValue)} entered`
        
        return res.status(400).json({
          success: false,
          message: message,
        });
      }

    if (process.env.NODE_ENV === 'production') {
        // Do not expose sensitive details in production
        return res.status(errStatus).json({
          success: false,
          message: errMessage,
        });
      }

      return res.status(errStatus).json({
        success: false,
        message: errMessage,
      });
}