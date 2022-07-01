import utilStyles from '../../styles/utils.module.css';

import { useState } from 'react';
import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';
import Army from '../../components/apps/combat-simulator/army';

const pageTitle = 'Combat Simulator';

var result = "";

export default function CombatSimulator() {
  
  // functions
  async function submitFight(e) {
    e.preventDefault();
    const data = new FormData(e.target);
    const payload = JSON.stringify(Object.fromEntries(data.entries()));
    const response = await fetch("/api/fight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: payload
    });
    console.log(response);
  
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    const fightResult = await response.json();
    result = fightResult.text;
  }

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <form 
          className='row' 
          id="fight-form" 
          onSubmit={submitFight}>
            <div className="col-md-6">
              <h3>Attacking Army</h3>
              <Army armyKey="attack" />
            </div>
            <div className="col-md-6">
              <h3>Defending Army</h3>
              <Army armyKey="defend" />
            </div>
            <div className="col-md">
              <h3>Controls</h3>
              <input 
                type="submit"
                className='btn btn-primary'
                value="Fight" />
            </div>
        </form>
        <div className='row'>
          <div className="col-md">
            <h3>Results</h3>
            <p>
              {result}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}