require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  universityId: process.env.UNIVERSITY_ID,
  academicAPI: {
    baseURL: process.env.ACADEMIC_API_URL || 'https://apis.academic.lat/v3',
    token: process.env.ACADEMIC_API_TOKEN
  }
};

const validateConfig = () => {
  if (!config.academicAPI.token) {
    console.error('ERROR: ACADEMIC_API_TOKEN no configurado en .env');
    process.exit(1);
  }
};

module.exports = { config, validateConfig };