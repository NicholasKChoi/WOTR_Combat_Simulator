import utilStyles from '../../styles/utils.module.css';

import { useState } from 'react';
import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';
import Army from '../../components/apps/combat-simulator/army';
import Results from '../../components/apps/combat-simulator/results';

const pageTitle = 'Combat Simulator';

export default function CombatSimulator() {
  const [result, setResult] = useState("");
  
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
    setResult(fightResult);
  }

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <form 
          className='row mb-2 pb-3 border-bottom border-info'
          id="fight-form" 
          onSubmit={submitFight}>
            <div className='row mb-4'>
              <div className="col-md-6">
                <h3>Attacking Army</h3>
                <Army armyKey="attack" />
              </div>
              <div className="col-md-6">
                <h3>Defending Army</h3>
                <Army armyKey="defend" />
              </div>
            </div>
            <div className='row'>
              <div className="col">
                <input 
                  type="submit"
                  className='btn btn-primary'
                  value="Fight!" />
              </div>
            </div>
        </form>
        <div className='row'>
          <div className="col-md">
            <h2 className='border-bottom'>Results</h2>
            {result !== "" ? <Results {...result} /> : ""}
          </div>
        </div>
      </section>
    </Layout>
  );
}