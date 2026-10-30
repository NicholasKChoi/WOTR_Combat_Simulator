import utilStyles from '../../styles/utils.module.css';

import { useState } from 'react';
import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';
import Army from '../../components/apps/combat-simulator/army';
import Results from '../../components/apps/combat-simulator/results';

const pageTitle = 'Combat Simulator';

async function errorMessage(response) {
  try {
    const body = await response.json();
    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {}
  return `The fight could not be run (HTTP ${response.status}).`;
}

export default function CombatSimulator() {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  
  // functions
  async function submitFight(e) {
    e.preventDefault();
    setError("");
    const submitted = Object.fromEntries(new FormData(e.target).entries());
    const payload = JSON.stringify(submitted);
    try {
      const response = await fetch("/api/fight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: payload
      });

      if (!response.ok) {
        setResult("");
        setError(await errorMessage(response));
        return;
      }
      const summary = await response.json();
      setResult({ submitted, summary });
    } catch {
      setResult("");
      setError("The fight could not be run. Please try again.");
    }
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
            <div className='row mb-3 small-font-size'>
              <div className="col-md-3">
                <label htmlFor="battles">Battles</label>
                <input
                  type="number"
                  id="battles"
                  name="battles"
                  className="form-control"
                  defaultValue={1000}
                  min={1}
                  max={100000}
                  step={1} />
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
            {error !== "" ? (
              <div className='row mt-3'>
                <div className="col">
                  <div role="alert" className="alert alert-danger mb-0">{error}</div>
                </div>
              </div>
            ) : ""}
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