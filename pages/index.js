import cn from 'classnames'
import Head from 'next/head';
import Link from 'next/link';

import Layout, { siteTitle } from '../components/layout';
import utilStyles from '../styles/utils.module.css';

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <section className={utilStyles.headingMd}>
        <p>
          This website is used for housing multiple apps that help you compete
          and have fun with games! These games are not popular and so this website
          isn't expected to drive lots of traffic. If that changes, lmk and I'll work
          on it.
        </p>
      </section>
      <section className={utilStyles.headingMd}>
        <h2>Apps</h2>
        <ul>
          <li className={utilStyles.headingMd}>
            ⚔️{' '}
            <Link href="/apps/combat-simulator">
              <a>Combat Simulator</a>
            </Link>
          </li>
          <li className={utilStyles.headingMd}>
            🚀{' '}
            <Link href="/apps/starcraft-helper">
              <a>Starcraft Helper</a>
            </Link>
          </li>
        </ul>
      </section>
      <section className={cn(utilStyles.lightText, utilStyles.headingSm)}>
        <p>
          This website is powered by{' '}
          <a href="https://nextjs.org/learn">the Next.js tutorial</a>.
          Submit bugs, issues, or contribute at{' '}
          <a href='https://github.com/NicholasKChoi/WOTR_Combat_Simulator'>GitHub</a>.
        </p>
      </section>
    </Layout>
  );
}
