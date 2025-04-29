const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'katherineprendas2004@gmail.com',
        pass: 'ptjinwvymzcawkyj'
    },
    tls: {
        rejectUnauthorized: false // Ignora errores de certificados autofirmados
    }
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

exports.register = async (req, res) => {
    try {
        const { email, password, phoneNumber, pin, name, lastName, country, birthDate } = req.body;

        const age = calculateAge(birthDate);
        if (age < 18) {
            return res.status(400).json({ message: 'Debes ser mayor de 18 años' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
            phoneNumber,
            pin,
            name,
            lastName,
            country,
            birthDate,
            status: 'pending',
            profileCompleted: true
        });

        await user.save();

        const verificationToken = jwt.sign({ email }, 'verification-secret', { expiresIn: '1h' });
        const verificationLink = `http://localhost:3000/auth/verify-email?token=${verificationToken}`;

        await transporter.sendMail({
            from: '"KidsTube" <josuedavidbolanos2004@gmail.com>',
            to: email,
            subject: 'Verifica tu cuenta en KidsTube',
            html: `<p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
                 <a href="${verificationLink}">Verificar Correo</a>`
        });

        res.status(201).json({ message: 'Usuario registrado. Revisa tu correo para verificar tu cuenta.' });
    } catch (error) {
        res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const decoded = jwt.verify(token, 'verification-secret');
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        user.status = 'active';
        await user.save();

        res.redirect('http://localhost:5500/index.html');
    } catch (error) {
        res.status(400).json({ message: 'Enlace de verificación inválido o expirado' });
    }
};

exports.googleAuth = async (req, res) => {
    try {
        const { token } = req.body;

        // Verificar el token de Google
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const email = payload['email'];
        const name = payload['given_name'];
        const lastName = payload['family_name'];

        let user = await User.findOne({ googleId });

        if (!user) {
            // Registro: Crear nuevo usuario
            user = await User.findOne({ email });
            if (user) {
                // El correo ya existe con otro método de autenticación
                return res.status(400).json({ message: 'El correo ya está registrado con otro método de autenticación' });
            }

            user = new User({
                googleId,
                email,
                name,
                lastName,
                status: 'active', // No requiere verificación de correo
                profileCompleted: false // Necesita completar el perfil
            });
            await user.save();

            // Generar token temporal para completar el perfil
            const tempToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || '12345', { expiresIn: '1h' });
            return res.status(201).json({ tempToken, redirect: '/completeProfile.html' });
        }

        // Login: Usuario ya existe
        if (!user.profileCompleted) {
            // Perfil incompleto, redirigir a completar perfil
            const tempToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || '12345', { expiresIn: '1h' });
            return res.status(200).json({ tempToken, redirect: '/completeProfile.html' });
        }

        // Perfil completo, proceder con 2FA
        if (!user.phoneNumber || !/^\+\d{10,15}$/.test(user.phoneNumber)) {
            return res.status(400).json({ message: 'Número de teléfono inválido. Completa tu perfil.' });
        }

        let verificationCode = user.tempCode;
        const now = new Date();
        if (!verificationCode || !user.tempCodeExpires || now > user.tempCodeExpires) {
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.tempCode = verificationCode;
            user.tempCodeExpires = new Date(now.getTime() + 5 * 60 * 1000);
            await user.save();

            try {
                const message = await twilioClient.messages.create({
                    body: `Tu código de verificación para KidsTube es: ${verificationCode}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: user.phoneNumber
                });
                console.log(`Mensaje enviado con SID: ${message.sid}`);
            } catch (twilioError) {
                console.error('Error al enviar SMS con Twilio:', twilioError);
                return res.status(500).json({ message: 'Error al enviar el SMS', error: twilioError.message });
            }
        }

        res.status(200).json({ message: 'Código de verificación enviado al SMS', email });
    } catch (error) {
        console.error('Error en autenticación con Google:', error);
        res.status(500).json({ message: 'Error en autenticación con Google', error: error.message });
    }
};

exports.completeProfile = async (req, res) => {
    try {
        const { token, phoneNumber, pin, country, birthDate } = req.body;

        const decoded = jwt.verify(token, process.env.JWT_SECRET || '12345');
        const user = await User.findOne({ _id: decoded.userId, email: decoded.email });

        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const age = calculateAge(birthDate);
        if (age < 18) {
            return res.status(400).json({ message: 'Debes ser mayor de 18 años' });
        }

        user.phoneNumber = phoneNumber;
        user.pin = pin;
        user.country = country;
        user.birthDate = birthDate;
        user.profileCompleted = true;
        user.status = 'active';

        await user.save();

        const authToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || '12345', { expiresIn: '1h' });
        res.status(200).json({ token: authToken, message: 'Perfil completado exitosamente' });
    } catch (error) {
        console.error('Error al completar perfil:', error);
        res.status(500).json({ message: 'Error al completar perfil', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        if (user.googleId) {
            return res.status(400).json({ message: 'Este usuario está registrado con Google. Usa el inicio de sesión con Google.' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ message: 'Cuenta pendiente de verificación. Revisa tu correo.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        if (!user.phoneNumber || !/^\+\d{10,15}$/.test(user.phoneNumber)) {
            return res.status(400).json({ message: 'Número de teléfono inválido. Debe estar en formato internacional (ej: +50612345678)' });
        }

        let verificationCode = user.tempCode;
        const now = new Date();
        if (!verificationCode || !user.tempCodeExpires || now > user.tempCodeExpires) {
            verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.tempCode = verificationCode;
            user.tempCodeExpires = new Date(now.getTime() + 5 * 60 * 1000);
            await user.save();

            console.log(`Código generado y guardado para ${email}: ${verificationCode}`);

            try {
                const message = await twilioClient.messages.create({
                    body: `Tu código de verificación para KidsTube es: ${verificationCode}`,
                    from: process.env.TWILIO_PHONE_NUMBER,
                    to: user.phoneNumber
                });
                console.log(`Mensaje enviado con SID: ${message.sid}`);
            } catch (twilioError) {
                console.error('Error al enviar SMS con Twilio:', twilioError);
                return res.status(500).json({ message: 'Error al enviar el SMS', error: twilioError.message });
            }
        } else {
            console.log(`Código existente para ${email}: ${verificationCode}`);
        }

        res.status(200).json({ message: 'Código de verificación enviado al SMS', email });
    } catch (error) {
        console.error('Error general en login:', error);
        res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
    }
};

exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        const now = new Date();
        if (!user.tempCode || !user.tempCodeExpires || now > user.tempCodeExpires) {
            return res.status(400).json({ message: 'El código ha expirado. Por favor, inicia sesión de nuevo para recibir un nuevo código.' });
        }

        const receivedCode = String(code).trim();
        const storedCode = String(user.tempCode).trim();

        console.log(`Código ingresado por el usuario (${email}): ${receivedCode}`);
        console.log(`Código almacenado en la base de datos: ${storedCode}`);

        if (storedCode !== receivedCode) {
            return res.status(400).json({ message: 'Código de verificación incorrecto' });
        }

        user.tempCode = undefined;
        user.tempCodeExpires = undefined;
        await user.save();

        const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || '12345', { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error al verificar código:', error);
        res.status(500).json({ message: 'Error al verificar código', error: error.message });
    }
};

exports.verificarPin = async (req, res) => {
    try {
        const { token, userPin } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || '12345');
        const user = await User.findOne({ _id: decoded.userId, email: decoded.email });
        if (!user) {
            return res.status(400).json({ error: 'Usuario no encontrado' });
        }

        if (userPin !== user.pin) {
            return res.status(400).json({ error: 'PIN incorrecto' });
        }

        res.status(200).json({ message: 'PIN correcto' });
    } catch (error) {
        console.error('Error al verificar PIN:', error);
        res.status(401).json({ error: error.message });
    }
};

exports.verificarAuth = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '12345');

        if (decoded.verificar === 'false') {
            res.status(200).json({ message: 'No autorizado' });
        } else {
            throw new Error('No autorizado');
        }
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};