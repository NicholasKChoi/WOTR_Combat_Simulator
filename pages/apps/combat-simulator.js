import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';

const pageTitle = 'Combat Simulator';

export default function CombatSimulator() {
  return (
    <Layout home>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <h1>{pageTitle}</h1>
        <p>
          PLACE HOLDER FOR COMBAT SIMULATOR
        </p>
      </section>
    </Layout>
  );
}