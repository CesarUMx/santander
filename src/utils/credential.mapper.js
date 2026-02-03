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
  console.log('País normalizado:', normalized);
  console.log('Código Alpha-2:', result);
  console.log('==========================================\n');
  
  return result;
};

const mapToCredential = (academicData) => {
  console.log('\n==========================================');
  console.log('INICIANDO MAPEO DE CREDENCIALES');
  console.log('==========================================');
  
  const informacion = academicData?.informacion?.[0] || {};
  const informacionContacto = informacion?.informacion_contacto || {};
  const informacionNacimiento = informacion?.informacion_nacimiento || {};
  const inscripcionAdministrativa = informacion?.inscripcion_administrativa || {};
  const ofertaEducativa = inscripcionAdministrativa?.oferta_educativa || {};

  console.log('\nDatos extraídos de la API:');
  console.log('- Nombre:', informacion.nombre);
  console.log('- Apellido Paterno:', informacion.apellido_paterno);
  console.log('- Apellido Materno:', informacion.apellido_materno);
  console.log('- CURP:', informacion.curp);
  console.log('- Nacionalidad:', informacionNacimiento.nacionalidad);
  console.log('- Teléfono:', informacionContacto.telefono_movil);
  console.log('- Email:', informacionContacto.correo_electronico);
  console.log('- Fecha Nacimiento:', informacionNacimiento.fecha);
  console.log('- ID Usuario:', informacion.id);
  console.log('- Fecha Ingreso:', informacion.fecha_ingreso);
  console.log('- Foto:', informacion.foto);
  console.log('- Curso:', ofertaEducativa.nombre);

  const curpValidation = validateCURP(informacion.curp);
  const nationalityAlpha2 = convertToAlpha2(informacionNacimiento.nacionalidad);

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

    userUniversities: {
      userId: informacion.id || '',
      creationDate: informacion.fecha_ingreso || '',
      userImage: {
        url: informacion.foto || '',
      },
      courses: ofertaEducativa.nombre || '',
      university: {
        universityId: config.universityId,
      },
    },

    userNotificationsGroups: {
      mandatory: ['student'],
      optional: [],
    },
  };

  console.log('\n========== CREDENCIAL MAPEADA ==========');
  console.log(JSON.stringify(credential, null, 2));
  console.log('==========================================\n');

  return credential;
};

module.exports = {
  mapToCredential,
  validateCURP,
  convertToAlpha2,
};
