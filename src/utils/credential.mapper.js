const { config } = require('../config');
const countries = require('i18n-iso-countries');

countries.registerLocale(require('i18n-iso-countries/langs/es.json'));
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

const validateCURP = (curp) => {
  console.log('\n========== VALIDACIÓN DE CURP ==========');
  console.log('CURP recibido:', curp);
  
  if (!curp || typeof curp !== 'string') {
    console.log('CURP inválido: vacío o no es string');
    console.log('Resultado: isValid=false, documentType=dni');
    console.log('========================================\n');
    return { isValid: false, curp: '' };
  }

  const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
  const isValid = curpRegex.test(curp.toUpperCase());

  console.log('CURP normalizado:', curp.toUpperCase());
  console.log('Formato válido:', isValid);
  console.log('documentType asignado:', isValid ? 'curp' : 'dni');
  console.log('========================================\n');

  return {
    isValid,
    curp: curp.toUpperCase()
  };
};

const getCourseType = (courseName) => {
  if (!courseName || typeof courseName !== 'string') {
    return 'other';
  }

  const normalized = courseName.trim().toUpperCase();

  if (normalized.startsWith('LICENCIATURA')) {
    return 'degree';
  } else if (normalized.startsWith('MAESTRÍA') || normalized.startsWith('MAESTRIA')) {
    return 'master';
  } else if (normalized.startsWith('DOCTORADO')) {
    return 'doctorate';
  } else if (normalized === 'BACHILLERATO GENERAL' || normalized.startsWith('BACHILLERATO')) {
    return 'high school';
  } else if (normalized.startsWith('DIPLOMADO')) {
    return 'other';
  }

  return 'other';
};

const convertToAlpha2 = (countryName) => {
  console.log('\n========== CONVERSIÓN A ALPHA-2 ==========');
  console.log('País recibido:', countryName);
  
  if (!countryName || typeof countryName !== 'string') {
    console.log('País inválido, usando default: MX');
    console.log('==========================================\n');
    return 'MX';
  }

  const normalized = countryName.trim();
  
  let alpha2Code = countries.getAlpha2Code(normalized, 'es');
  
  if (!alpha2Code) {
    alpha2Code = countries.getAlpha2Code(normalized, 'en');
  }
  
  const result = alpha2Code || 'MX';
  
  return result;
};

const mapToCredential = (academicData) => {
  
  const informacion = academicData?.informacion?.[0] || {};
  const informacionContacto = informacion?.informacion_contacto || {};
  const informacionNacimiento = informacion?.informacion_nacimiento || {};
  const inscripcionAdministrativa = informacion?.inscripcion_administrativa || {};
  const ofertaEducativa = inscripcionAdministrativa?.oferta_educativa || {};

  const curpValidation = validateCURP(informacion.curp);
  const nationalityAlpha2 = convertToAlpha2(informacionNacimiento.nacionalidad);
  
  const courseName = ofertaEducativa.nombre || '';
  const courseType = getCourseType(courseName);
  
  console.log('\n========== TIPO DE CURSO ==========');
  console.log('Nombre del curso:', courseName);
  console.log('Tipo asignado:', courseType);
  console.log('===================================\n');

  const credential = {
    person: {
      personName: {
        givenName: informacion.nombre || '',
        lastName: informacion.apellido_paterno || '',
        secondLastName: informacion.apellido_materno || '',
      },
      contactPoint: {
        telephone: informacionContacto.telefono_movil || '',
        emailAddress: informacionContacto.correo_electronico || '',
      },
      document: {
        documentNumber: curpValidation.curp,
        issuerEntityCountry: nationalityAlpha2,
        documentType: curpValidation.isValid ? 'curp' : 'dni'
      },
      nationality: {
        countryCode: nationalityAlpha2,
      },
      birthDate: informacionNacimiento.fecha || '',
    },

    userUniversities:[
      {
        userId: String(informacion.id || ''),
        creationDate: informacion.fecha_ingreso || '',
        userImage: {
          url: informacion.foto || '',
        },
        courses: [
          {
            name: courseName,
            type: courseType
          }
        ],
        university: {
          universityId: config.universityId,
        },
      },
    ],
    userNotificationsGroups: {
      mandatory: ['student'],
      optional: [],
    },
  };

  return credential;
};

module.exports = {
  mapToCredential,
  validateCURP,
  convertToAlpha2,
  getCourseType,
};
