import 'bootstrap/dist/css/bootstrap.css'
import Head from "next/head";

import '../styles/global.css';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="shortcut icon" href="/images/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
      </Head>

      <Component {...pageProps} />
    </>
  );
}
