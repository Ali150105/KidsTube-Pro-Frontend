
# KidsTube_Pro_Frontend

## Descripción  

KidsTube es una solución tecnológica integral diseñada para facilitar el control parental sobre el consumo de contenido multimedia infantil. La plataforma permite:

Curar contenido digital: Selección y aprobación de material audiovisual procedente de YouTube o cargado directamente por los tutores

Gestionar perfiles: Creación de entornos personalizados por cada menor

Supervisar accesos: Registro detallado de interacciones y tiempos de visualización

## Diagrama 

![image](https://github.com/user-attachments/assets/9ed9aa47-07cf-4bf5-a25a-3fee9bfaea47)
 

## Tecnologías utilizadas  

Bootstrap: El maquillaje que hace todo bonito y responsive

HTML/CSS: Los esqueletos y la ropa de la página

JavaScript: El cerebro que hace que todo se mueva

Google Sign-In: Para entrar con tu cuenta de Google (como cuando usas "Ingresar con Gmail")

YouTube Data API: Nuestro buscador de videos seguros

Twilio: El que manda SMS con códigos secretos al celular de mamá/papá

Nodemailer: El cartero electrónico (envía emails de verificación)

## Instalación  
1. Clona este repositorio en tu máquina local:  

```
https://github.com/Ali150105/KidsTube-Pro-Frontend
```
2. Navega al directorio del proyecto:  

```
cd kidstube-server
```
3. Instala las dependencias:  

```
npm install
```
4. Configura las variables de entorno en `.env`:   

```
MONGODB_URI=tu_cadena_de_conexión
JWT_SECRET=tu_clave_secreta

```
5. Inicia la aplicación:  

```
node app.js

```
