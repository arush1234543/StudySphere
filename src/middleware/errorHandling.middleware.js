export function errorHandling(err, req, res, next) {
    console.error(err);

    return res.status(400).json({
        success: false,
        message: err.message
    });
}