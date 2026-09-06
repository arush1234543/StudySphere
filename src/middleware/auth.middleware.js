export async function checkEmailBody(req, res, next) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: "Email is a mandatory field" });
    }
    next();
}
export async function checkPasswordBody(req, res, next) {
    const { password } = req.body || {};
    if (!password) {
        return res.status(400).json({ message: "Password is a mandatory field" });
    }
    next();
}
export async function checkUsernameBody(req, res, next) {
    const { username } = req.body || {};
    if (!username) {
        return res.status(400).json({ message: "Username is a mandatory field" });
    }
    next();
}
export async function checkOTPBody(req, res, next) {
    const { otp } = req.body || {};
    if (!otp) {
        return res.status(400).json({ message: "OTP are a mandatory field" });
    }
    next();
}
export async function checkRefreshToken(req, res, next) {
    const { refreshToken } = req.cookies

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token not found"
        });
    }
    next()
}
export async function checkAccessToken(req, res, next) {
    const { accessToken } = req.body
    if (!accessToken) {
        return res.status(401).json({
            success: false,
            message: "Access token not found"
        });
    }
    next()
}
export async function chechIfAuthenticated(req, res, next) {
    const {refreshToken} = req.cookies
    if(!refreshToken){
        res.status(400).json({
            success: false,
            message: "User is logged out"
        })
    }
    next()
}