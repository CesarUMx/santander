require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  universityId: process.env.UNIVERSITY_ID,
  serverUrl: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 3000}`,
  defaultAvatar: '/public/DragobertoHEAD.png',
  academicAPI: {
    baseURL: process.env.ACADEMIC_API_URL || 'https://apis.academic.lat/v3',
    token: process.env.ACADEMIC_API_TOKEN
  },
  mit: {
    aesKey: process.env.MIT_AES_KEY,
    data0: process.env.MIT_DATA0,
    idCompany: process.env.MIT_ID_COMPANY,
    idBranch: process.env.MIT_ID_BRANCH,
    mitUser: process.env.MIT_USER,
    mitPwd: process.env.MIT_PWD,
    urlQa: process.env.MIT_URL_QA || 'https://qa5.mitec.com.mx/p/gen',
    urlProd: process.env.MIT_URL_PROD || 'https://bc.mitec.com.mx/p/gen',
    webhookUrl: process.env.MIT_WEBHOOK_URL,
  },
};

const validateConfig = () => {
  if (!config.academicAPI.token) {
    console.error('ERROR: ACADEMIC_API_TOKEN no configurado en .env');
    process.exit(1);
  }
  if (!config.mit.aesKey) {
    console.error('WARN: MIT_AES_KEY no configurado — integración de pagos deshabilitada');
  }
};

module.exports = { config, validateConfig };