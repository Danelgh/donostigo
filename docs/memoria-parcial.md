# DonostiGo

## Desarrollo de una plataforma web para el descubrimiento y reserva de servicios en negocios locales de Donostia-San Sebastian

**Ciclo formativo:** Desarrollo de Aplicaciones Web (DAW)  
**Tipo de documento:** Memoria parcial del Trabajo de Fin de Grado  
**Fecha:** 15 de marzo de 2026  
**Alumno:** [Tu nombre]  
**Centro:** [Nombre del centro]  
**Tutor/a:** [Nombre del tutor o tutora]

---

## 1. Introduccion

El presente Trabajo de Fin de Grado tiene como objetivo el diseno y desarrollo de una aplicacion web denominada **DonostiGo**, orientada a centralizar la informacion y la gestion de reservas de pequenos negocios locales de Donostia-San Sebastian.

En la actualidad, muchos establecimientos de ambito local dependen de canales dispersos para mostrar sus servicios, como redes sociales, perfiles en distintas plataformas o paginas web propias con funcionalidades limitadas. Esta fragmentacion dificulta al usuario la localizacion de informacion y la realizacion de reservas de forma rapida y sencilla. De igual modo, muchos pequenos negocios no disponen de herramientas digitales accesibles para gestionar su presencia online y las reservas recibidas.

Ante esta situacion, se propone el desarrollo de una solucion web que permita a los usuarios consultar establecimientos organizados por categorias, acceder a la informacion detallada de cada negocio y realizar reservas desde una unica plataforma. Paralelamente, los negocios podran contar con un sistema basico de gestion de su perfil y de las solicitudes recibidas.

---

## 2. Justificacion del proyecto

La eleccion de este proyecto se fundamenta en la necesidad de aplicar de forma integrada los conocimientos adquiridos durante el ciclo formativo de Desarrollo de Aplicaciones Web. El desarrollo de DonostiGo permite trabajar de manera practica aspectos clave del perfil profesional de DAW, entre ellos:

- desarrollo de interfaces web responsive
- programacion en entorno cliente
- programacion en entorno servidor
- diseno y gestion de bases de datos relacionales
- consumo y diseno de APIs REST
- autenticacion de usuarios
- organizacion de un proyecto web completo

Ademas, la tematica escogida presenta una aplicacion realista y cercana, ya que se centra en el comercio local y en la digitalizacion de pequenos negocios, un ambito de interes creciente dentro del sector tecnologico y comercial.

---

## 3. Objetivos

### 3.1 Objetivo general

Desarrollar una aplicacion web completa que permita descubrir negocios locales y gestionar reservas de servicios de forma centralizada.

### 3.2 Objetivos especificos

- implementar un sistema de registro e inicio de sesion para usuarios y negocios
- desarrollar un catalogo de establecimientos clasificados por categorias
- mostrar la informacion detallada de cada negocio
- permitir la creacion de reservas por parte de los usuarios
- disenar una base de datos relacional adaptada a las necesidades del sistema
- desarrollar una API REST para comunicar frontend, backend y base de datos
- construir una interfaz web usable y adaptable a distintos dispositivos

---

## 4. Alcance del proyecto y MVP

Debido al tiempo disponible para el desarrollo del TFG, se ha definido un alcance inicial basado en un **producto minimo viable (MVP)**. Este enfoque permite priorizar las funcionalidades esenciales del sistema y asegurar una primera version funcional.

Las funcionalidades contempladas en esta primera fase son las siguientes:

- registro de usuarios
- inicio de sesion
- diferenciacion de roles entre usuario y negocio
- listado de negocios por categorias
- visualizacion del detalle de cada negocio
- creacion de reservas basicas
- consulta de reservas del usuario

Quedan fuera de esta primera entrega funcionalidades mas avanzadas como pagos online, valoraciones, geolocalizacion, notificaciones o un panel administrativo completo.

---

## 5. Analisis de requisitos

### 5.1 Requisitos funcionales

- el sistema debe permitir el registro de nuevos usuarios
- el sistema debe permitir el inicio de sesion mediante email y contrasena
- el sistema debe permitir listar negocios disponibles
- el sistema debe mostrar la informacion detallada de un negocio
- el sistema debe permitir crear reservas asociadas a un usuario y a un negocio
- el sistema debe permitir consultar las reservas realizadas por el usuario autenticado

### 5.2 Requisitos no funcionales

- la aplicacion debe ser accesible desde navegador web
- la interfaz debe adaptarse a dispositivos moviles y de escritorio
- la arquitectura debe seguir una separacion entre cliente, servidor y base de datos
- la informacion debe almacenarse en una base de datos relacional
- el codigo debe organizarse de forma modular para facilitar mantenimiento y ampliacion

---

## 6. Tecnologias utilizadas

Para el desarrollo del proyecto se han seleccionado tecnologias ampliamente utilizadas en el desarrollo web moderno:

### Frontend

- React
- Vite
- HTML5
- CSS3
- JavaScript ES6

### Backend

- Node.js
- Express

### Base de datos

- PostgreSQL

### Herramientas de apoyo

- Git y GitHub
- Postman
- Visual Studio Code

La eleccion de estas herramientas responde a su popularidad, documentacion disponible y adecuacion para el desarrollo de una aplicacion web basada en arquitectura cliente-servidor.

---

## 7. Arquitectura del sistema

La aplicacion sigue una arquitectura de tres capas:

- **Capa cliente:** desarrollada con React y Vite, encargada de la interfaz de usuario y de la interaccion con la API.
- **Capa servidor:** desarrollada con Node.js y Express, responsable de la logica de negocio, autenticacion y exposicion de endpoints REST.
- **Capa de datos:** basada en PostgreSQL, donde se almacenan usuarios, categorias, negocios y reservas.

El flujo general de funcionamiento es el siguiente:

1. El usuario interactua con la interfaz web.
2. El frontend realiza peticiones HTTP a la API REST.
3. El backend procesa las solicitudes y consulta o modifica los datos en PostgreSQL.
4. La respuesta se devuelve al frontend para su representacion.

---

## 8. Diseno de la base de datos

Se ha planteado una base de datos relacional compuesta inicialmente por las siguientes tablas:

### 8.1 Tabla `users`

Almacena la informacion de acceso de los usuarios registrados.

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`

### 8.2 Tabla `categories`

Permite clasificar los negocios por tipo de actividad.

- `id`
- `name`

### 8.3 Tabla `businesses`

Contiene la informacion principal de cada negocio.

- `id`
- `user_id`
- `category_id`
- `name`
- `description`
- `address`
- `phone`
- `created_at`

### 8.4 Tabla `reservations`

Relaciona a los usuarios con los negocios a traves de una reserva.

- `id`
- `user_id`
- `business_id`
- `reservation_date`
- `people`
- `status`
- `created_at`

### 8.5 Relaciones principales

- un usuario puede tener varias reservas
- un negocio puede recibir varias reservas
- una categoria puede agrupar varios negocios
- un negocio pertenece a un usuario con rol de negocio

> Nota: el esquema SQL inicial del proyecto se encuentra implementado y preparado para PostgreSQL.

---

## 9. Estado actual del desarrollo

En el momento de esta entrega parcial, correspondiente al **15 de marzo de 2026**, se ha avanzado en la preparacion de la base tecnica del proyecto.

### 9.1 Estructura inicial del proyecto

Se ha definido una estructura separada en tres bloques principales:

- `frontend/`
- `backend/`
- `database/`

Esta organizacion facilita la separacion de responsabilidades entre cliente, servidor y datos.

### 9.2 Backend inicial

Se ha preparado una API REST inicial con Express, incluyendo:

- configuracion base del servidor
- rutas para autenticacion
- rutas para negocios
- rutas para reservas
- middleware de autenticacion mediante token
- conexion preparada para PostgreSQL

### 9.3 Frontend inicial

Se ha desarrollado una base de aplicacion con React y Vite, con las siguientes vistas iniciales:

- pagina de inicio
- pagina de inicio de sesion
- pagina de registro
- listado de negocios
- detalle de negocio
- pantalla de reservas del usuario

### 9.4 Base de datos

Se ha definido e implementado un esquema SQL inicial con tablas, relaciones y datos de ejemplo, lo cual permite disponer de una base funcional para continuar el desarrollo.

---

## 10. Planificacion inmediata

Tras esta entrega parcial, los siguientes pasos del proyecto seran:

- conectar los formularios del frontend con la API REST
- completar la autenticacion de usuarios
- implementar el flujo real de creacion de reservas
- mostrar las reservas del usuario autenticado
- ampliar la gestion del perfil de negocio
- realizar pruebas funcionales del sistema
- documentar el desarrollo final y preparar la defensa del proyecto

---

## 11. Conclusion parcial

En esta primera fase del TFG se ha definido el problema a resolver, el alcance funcional del proyecto y la arquitectura tecnica sobre la que se desarrollara la aplicacion. Asimismo, se ha creado una base inicial del sistema compuesta por la estructura del proyecto, el diseno de la base de datos, la API backend y una interfaz frontend preliminar.

Aunque todavia quedan funcionalidades por implementar, el proyecto dispone ya de una base coherente y escalable sobre la que continuar el desarrollo durante las siguientes fases.

---

## 12. Anexos sugeridos para completar antes de entregar

Antes de entregar esta memoria parcial, conviene anadir:

- una captura de la estructura de carpetas del proyecto
- una captura del esquema de base de datos
- una captura de las pantallas iniciales del frontend
- una breve tabla de planificacion o cronograma

---

## 13. Observaciones para personalizar este documento

Antes de la entrega, revisa y sustituye:

- `[Tu nombre]`
- `[Nombre del centro]`
- `[Nombre del tutor o tutora]`

Tambien conviene adaptar la redaccion a las instrucciones concretas de tu centro, especialmente en lo relativo a formato, portada, indice, numeracion y extension minima.
