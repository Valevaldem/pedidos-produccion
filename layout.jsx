import './globals.css'

export const metadata = {
  title: 'Pedidos en Producción — MS',
  description: 'Control de pedidos en taller',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Poppins:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-greige min-h-screen font-poppins text-ink">
        {children}
      </body>
    </html>
  )
}
