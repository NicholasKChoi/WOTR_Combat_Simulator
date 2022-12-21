import utilStyles from '../../styles/utils.module.css';
import { useState } from 'react';

import cn from "classnames";
import Head from "next/head";
import Layout from "../../components/layout";

const pageTitle = 'Starcraft Helper';

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}


function GetVsText() {
  const partnerArray = ["matthew", "nick", "daniel"];
  shuffle(partnerArray);
  const sortedResult = partnerArray.slice(0, 2).sort()
  return `${sortedResult[0]} vs. ${sortedResult[1]}`;
}

let lastPartners = GetVsText();

export default function StarcraftHelper() {
  const [partners, setPartnerState] = useState(
    lastPartners
  );

  function SetPartners() {
    let newPartners = GetVsText();
    while (newPartners == lastPartners) {
      newPartners = GetVsText();
    }
    console.log(lastPartners, newPartners);
    lastPartners = newPartners;
    setPartnerState(newPartners);
  }

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <hr></hr>
        <div className='row mb-2 pb-3 border-bottom border-info'>
        <div className='col-6'>
          <div className='card'>
            <h5 className='card-header'>Fighter Select</h5>
            <div className="card-body">
              <h5 className="card-title">Select Fighters</h5>
              <p className="card-text fs-6">
                Two fighters will randomly be selected each time you 
                click the button below! 
              </p>
              <a className="btn btn-primary" onClick={SetPartners}>Randomize</a>
            </div>
            <h3 className='card-footer'>{partners}</h3>
          </div> 
        </div>
        </div>
      </section>
    </Layout> 
  );
}