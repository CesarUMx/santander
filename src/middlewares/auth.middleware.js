const googleService = require('../services/google.service');
const { errorResponse } = require('../utils/response.util');

const validateGoogleToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(res, 'No se proporcionó token de autorización', 401);
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const email = googleService.getEmailFromToken(token);
    const matricula = googleService.getMatriculaFromEmail(email);
    const picture = googleService.getPictureFromToken(token);

    req.user = {
      email,
      matricula,
      picture,
      token
    };

    next();
  } catch (error) {
    return errorResponse(res, error.message, 401);
  }
};

module.exports = { validateGoogleToken };