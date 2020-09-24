  
import { createGlobalStyle, ThemeProvider } from 'styled-components'
import '../styles/globals.css'

const theme = {
  colors: {
    primary: '#0070f3',
  },
}

function MyApp({ Component, pageProps }) {
  return (<ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>)
}

export default MyApp