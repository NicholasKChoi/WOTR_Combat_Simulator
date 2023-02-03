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

function getMapText() {
  const mapArray = [
    'altitude', 'ancient cistern', 'babylon', 'dragon scales',
    'gresvan', 'neohumanity', 'royal blood'
  ];
  shuffle(mapArray);
  return mapArray[0];
}

let lastPartners = GetVsText();
let lastMap = getMapText();

export default function StarcraftHelper() {
  const [partners, setPartnerState] = useState(lastPartners);
  const [maps, setMapState] = useState(lastMap)

  function SetPartners() {
    let newPartners = GetVsText();
    while (newPartners == lastPartners) {
      newPartners = GetVsText();
    }
    lastPartners = newPartners;
    setPartnerState(newPartners);
  }

  function SetMap() {
    let newMap = getMapText();
    while (newMap == lastMap) {
      newMap = getMapText();
    }
    lastMap = newMap;
    setMapState(newMap);
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
            <h5 className='card-header'>Fighter wapow!</h5>
            <div className="card-body">
              <p className="card-text fs-6">
                Two fighters will randomly be selected each time you 
                click the button below! 
              </p>
              <a className="btn btn-primary" onClick={SetPartners}>Randomize</a>
            </div>
            <h3 className='card-footer'>{partners}</h3>
          </div> 
        </div>
        <div className='col-6'>
          <div className='card'>
            <h5 className='card-header'>Map Select</h5>
            <div className="card-body">
              <p className="card-text fs-6">
                A map from the current map pool will be selected each time
                you click the button below
              </p>
              <a className="btn btn-primary" onClick={SetMap}>Randomize</a>
            </div>
            <h3 className='card-footer'>{maps}</h3>
          </div> 
        </div>
        </div>
      </section>
    </Layout> 
  );
}