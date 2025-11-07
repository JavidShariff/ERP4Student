const asyncHandler = (requestHandler) => {
    return async (res,req,next)=>{
            Promise.resolve(requestHandler(res,req,next)).catch((err)=>{
            next(err);
        })
    }
}

export {asyncHandler};

// const asyncHandler = (requestHandler) => async (res,req,next)=> {
//     try {
//         await requestHandler(res,req,next);
//     } catch (error) {
//         res.status(error.status || 500).json({
//             success:false,
//             message:error.message 
//         })
//     }
// }