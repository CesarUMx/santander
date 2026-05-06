/**
 * Cifrado AES-128-CBC compatible con la implementación CryptoJS de MIT.
 * Usa el módulo 'crypto' nativo de Node.js.
 *
 * Algoritmo:
 *   - AES-128-CBC con PKCS7 padding
 *   - IV aleatorio de 16 bytes
 *   - Resultado: Base64(IV + datos_cifrados)
 *
 * Esto es matemáticamente idéntico al AES.js que MIT proporciona para browser.
 */

const crypto = require('crypto');

/**
 * Cifra una cadena de texto con AES-128-CBC.
 * @param {string} data - Texto plano a cifrar (ej: el XML armado)
 * @param {string} hexKey - Llave AES en formato hexadecimal (32 chars = 128 bits)
 * @returns {string} Cadena cifrada en Base64 (IV + ciphertext concatenados)
 */
function cifrarAES(data, hexKey) {
    const key = Buffer.from(hexKey, 'hex');
    const iv = crypto.randomBytes(16); // Vector de inicialización aleatorio de 16 bytes

    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Concatenar: [IV (16 bytes)] + [datos cifrados]
    const result = Buffer.concat([iv, encrypted]);
    return result.toString('base64');
}

/**
 * Descifra una cadena Base64 cifrada con AES-128-CBC.
 * @param {string} base64Data - Cadena cifrada en Base64 (IV + ciphertext)
 * @param {string} hexKey - Llave AES en formato hexadecimal (32 chars = 128 bits)
 * @returns {string} Texto plano descifrado (ej: el XML de respuesta)
 */
function descifrarAES(base64Data, hexKey) {
    const key = Buffer.from(hexKey, 'hex');

    // Primero hacer URL decode por si la cadena viene con %2B, %3D, %2F, etc.
    // (MIT puede enviar el strResponse del webhook URL-encoded)
    const decoded = decodeURIComponent(base64Data);
    const raw = Buffer.from(decoded, 'base64');

    const iv = raw.slice(0, 16);       // Primeros 16 bytes = IV
    const encrypted = raw.slice(16);   // El resto = datos cifrados

    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
}

module.exports = { cifrarAES, descifrarAES };
