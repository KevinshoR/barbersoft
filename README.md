# Barbersoft

Sistema de gestión para barberías desarrollado con Node.js, Express y React. Permite administrar citas, clientes y servicios de una barbería de forma sencilla.

---

## Tecnologías Utilizadas

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Base de datos:** SQL Server
- **Control de versiones:** Git / GitHub

---

## Funcionalidades

- Gestión de citas y turnos
- Registro de clientes
- Administración de servicios
- Panel de control para el barbero

---

##  Estructura del proyecto

```
barbersoft/
├── client/          # Frontend en React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
├── server/          # Backend en Node.js
│   ├── routes/
│   ├── db.js
│   └── server.js
└── README.md
```

---

## Instalación y uso

### Requisitos previos
- Node.js v18 o superior
- SQL Server
- Git

## Clonar el repositorio

```bash
git clone https://github.com/KevinshoR/barbersoft.git
cd barbersoft
```

### Instalar dependencias del backend

```bash
cd server
npm install
```

### Instalar dependencias del frontend

```bash
cd client
npm install
```

### Configurar variables de entorno

Creá un archivo `.env` en la carpeta `server/` con:

```env
DB_SERVER=localhost
DB_NAME=barbersoft
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
PORT=3000
```

### Correr el proyecto

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

---

## 👨‍💻 Autor

**Kevin Meneses** — Aprendiz ADSO, SENA Medellín  
📧 alejandrovinkeuno@gmail.com  
🔗 [github.com/KevinshoR](https://github.com/KevinshoR)

---

> Proyecto en desarrollo — construido como parte del aprendizaje en Análisis y Desarrollo de Software.
