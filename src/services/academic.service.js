const axios = require('axios');
const { config } = require('../config');

class AcademicService {
  constructor() {
    this.baseURL = config.academicAPI.baseURL;
    this.token = config.academicAPI.token;
  }

  async getStudentByMatricula(matricula) {
    try {
      const url = `${this.baseURL}/schoolControl/students`;
      
      const requestConfig = {
        method: 'get',
        url: url,
        params: {
          onlyCurrentStudents: false,
          registrationTag: matricula
        },
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'authorization': `Bearer ${this.token}`
        }
      };
      
      // URL completa con parámetros
      const fullUrl = `${url}?${new URLSearchParams(requestConfig.params).toString()}`;

      const response = await axios(requestConfig);

      // ===== LOG DE RESPUESTA EXITOSA =====
      console.log('\n==========================================');
      console.log('RESPUESTA EXITOSA DE ACADEMIC API');
      console.log('==========================================');

      return response.data;

    } catch (error) {
      
      if (error.response) {
        throw new Error(`Academic API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        throw new Error('No se recibió respuesta de Academic API');
      } else {
        throw new Error(`Error al consultar Academic API: ${error.message}`);
      }
    }
  }
}

module.exports = new AcademicService();