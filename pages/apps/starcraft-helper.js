import utilStyles from '../../styles/utils.module.css';
import { useState } from 'react';

import cn from "classnames";
import Head from "next/head";
import Layout from "../../components/layout";

const pageTitle = 'Starcraft Helper';
const mapArray = [
  'altitude', 'ancient cistern', 'babylon', 'dragon scales',
  'gresvan', 'neohumanity', 'royal blood'
];
const partnerArray = ["matthew", "nick", "daniel"];

function shuffle(array) {
  const clone = [...array]
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [clone[currentIndex], clone[randomIndex]] = [
      clone[randomIndex], clone[currentIndex]];
  }

  return clone;
}

function GetVsText() {
  const shuffled = shuffle(partnerArray);
  const sortedResult = shuffled.slice(0, 2).sort()
  return `${sortedResult[0]} vs. ${sortedResult[1]}`;
}

function getMapText(lastMap) {
  const shuffled = shuffle(mapArray);
  for (let i = 0; i < shuffled.length; i++)
  {
    if (shuffled[i] == lastMap)
    {
      continue;
    }
    else 
    {
      return shuffled[i];
    }
  }
  return "FAILURE"
}

export default function StarcraftHelper() {
  const [partners, setPartnerState] = useState(`${partnerArray[0]} vs. ${partnerArray[1]}`);
  const [maps, setMapState] = useState(mapArray[0]);

  function SetPartners() {
    let newPartners = GetVsText();
    while (newPartners == lastPartners) {
      newPartners = GetVsText();
    }
    lastPartners = newPartners;
    setPartnerState(newPartners);
  }

  function SetMap() {
    let newMap = getMapText(lastMap);
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
        <div className='row pb-3'>
          <div className='col-6'>
            <div className='card'>
              <h5 className='card-header'>Fighter Select</h5>
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
          
        </div>
        <div className='row mb-2 pb-3 border-bottom border-info'>
          <div className='col-6'>
            <div className='card'>
              <h5 className='card-header'>Map Strike</h5>
              <div className="card-body">
              <div className="form-check">
                <div className="list-container">
                  {mapArray.map((item, index) => (
                    <div key={index}>
                      <input class="form-check-input" value={item} id={item} type="checkbox" />
                      <label class="form-check-label" >{item}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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