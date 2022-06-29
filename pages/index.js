import cn from 'classnames'
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

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
          This website is used for housing multiple War of the Ring Simulations. Each simulation
          should  educate the theory behind playing War of the Ring and improving my skills in
          making simple Single-Page-Applications
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
        </ul>
      </section>
      <section className={cn(utilStyles.lightText, utilStyles.headingSm)}>
        <p>
          This website is powered by{' '}
          <a href="https://nextjs.org/learn">the Next.js tutorial</a>.
        </p>
      </section>
    </Layout>
  );
}