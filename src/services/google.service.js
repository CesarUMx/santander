const jwt = require('jsonwebtoken');

class GoogleService {
  decodeToken(token) {
    try {
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        throw new Error('Token inválido');
      }
      
      return decoded;
    } catch (error) {
      throw new Error(`Error al decodificar token: ${error.message}`);
    }
  }

  getEmailFromToken(token) {
    const decoded = this.decodeToken(token);
    
    if (!decoded.email) {
      throw new Error('Token no contiene email');
    }
    
    return decoded.email;
  }

  getMatriculaFromEmail(email) {
    const matricula = email.split('@')[0];
    return matricula;
  }
}

module.exports = new GoogleService();