import utilStyles from '../../styles/utils.module.css';


import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';

const pageTitle = 'Combat Simulator';

export default function CombatSimulator() {
  return (
    <Layout home>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <div class='row'>
          <div class="col-md">
            <h3>Attacking Army</h3>
          </div>
          <div class="col-md">
            <h3>Defending Army</h3>
          </div>
        </div>
        <div class='row'>
          <div class="col-md">
            <h3>Controls</h3>
            <button class='btn btn-primary'>Fight!</button>
          </div>
        </div>
        <div class='row'>
          <div class="col-md">
            <h3>Results</h3>
          </div>
        </div>
      </section>
    </Layout>
  );
}