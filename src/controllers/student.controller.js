const academicService = require('../services/academic.service');
const { errorResponse } = require('../utils/response.util');
const { mapToCredential } = require('../utils/credential.mapper');

class StudentController {
  async getStudentInfo(req, res) {
    try {
      const { email, matricula, picture } = req.user;

      const academicData = await academicService.getStudentByMatricula(matricula);

      const credential = mapToCredential(academicData, picture, email);

      return res.status(200).json(credential);

    } catch (error) {
      return errorResponse(res, 'Error al obtener información del estudiante', 500, error.message);
    }
  }
}

module.exports = new StudentController();