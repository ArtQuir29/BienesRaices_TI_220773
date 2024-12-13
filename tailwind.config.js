/** @type {import('tailwindcss').Config} */
export default {
  content: ['./views/**/*.pug'],  
  theme: {
    extend: {
      colors: {
        violetCustom: '#9381FF',    // Violeta
        lightBlue: '#B8B8FF',       // Azul claro
        softWhite: '#F8F7FF',       // Blanco suave
        pastelYellow: '#FFEEDD',    // Amarillo pastel
        peach: '#FFD8BE',           // Durazno
      },
    },
  },
  plugins: [],
}


