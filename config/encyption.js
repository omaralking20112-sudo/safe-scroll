const crypto = require('crypto');

class EncryptionService {
    constructor() {
        this.algorithm ='aes-256-gcm';
        this.kayLength = 32 ;
        this.ivLength = 16 ;

    }
    generateKayPair() {
        const {publicKay,privateKey} = crypto.generateKeyPairSync('rsa',{ 
            modulusLength : 4096,
            publicKeyEncoding :{
                type : 'spki',
                format : 'pem'
            },
            privateKeyEncoding :{
                type: 'pkcs8',
                format:'pem',
                cipher : 'aes-256-cbc',
                passphrase : process.env.ENCRYPTION_SECRET
            }
        });
        return{publicKay , privateKey};
    }
    encryptMwssage(text , publicKay) {
        const ephemeralKay = crypto.randomBytes(this.kayLength);
        const iv = crypto.randomBytes(this.ivLength);

        const encrypedKay = crypto.publicEncrypt(publicKay, ephemeralKay);

        const cipher =crypto.createCipheriv(this.algorithm, ephemeralKay, iv);
        let encrypted = cipher.update(text , 'utf8', 'hex');
        encrypted += ciphe.final('hex');
        const authTag = cipher.getAuthTag();

        return {
            kay : encrypedKay.toString('base64'),
            iv : iv.toString('base64'),
            tag: authTag.toString('base64'),
            data : encrypted 
        };
    }
    // 🔓 فك تشفير رسالة
    decryptMessage(encryptedData, privateKey) {
        try {
            const ephemeralKey = crypto.privateDecrypt(
                {
                    key: privateKey,
                    passphrase: process.env.ENCRYPTION_SECRET
                },
                Buffer.from(encryptedData.key, 'base64')
            );

            const decipher = crypto.createDecipheriv(
                this.algorithm,
                ephemeralKey,
                Buffer.from(encryptedData.iv, 'base64')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
            
            let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('❌ Decryption failed:', error);
            return null;
        }
    }
}

module.exports = new EncryptionService();
