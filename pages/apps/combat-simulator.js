import utilStyles from '../../styles/utils.module.css';


import Head from 'next/head';
import cn from 'classnames'

import Layout from '../../components/layout';
import Army from '../../components/apps/combat-simulator/army';

const pageTitle = 'Combat Simulator';

var attackingArmy = {
  regulars: 0,
  elites: 0,
  leaders: 0
};

var defendingArmy = {
  regulars: 0,
  elites: 0,
  leaders: 0
};

function createArmyUpdater(army, value) {
  return function(e) {
    var armyObj;
    if (army == "attack") {
      armyObj = attackingArmy;
    } else if (army == "defend") {
      armyObj = defendingArmy;
    } else {
      throw "invalid army type";
    }
    if (!armyObj.hasOwnProperty(value)) {
      throw "invalid key value for army updater";
    }
    armyObj[value] = Number(e.target.value);
    console.log(army, armyObj);
  }
};

export default function CombatSimulator() {
  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <section className={cn(utilStyles.headingMd, "container")}>
        <h1>{pageTitle}</h1>
        <div className='row'>
          <div className="col-md">
            <h3>Attacking Army</h3>
            <Army 
              createArmyUpdater={createArmyUpdater}
              armyKey="attack" />
          </div>
          <div className="col-md">
            <h3>Defending Army</h3>
            <Army 
              createArmyUpdater={createArmyUpdater}
              armyKey="defend" />
          </div>
        </div>
        <div className='row'>
          <div className="col-md">
            <h3>Controls</h3>
            <button className='btn btn-primary'>Fight!</button>
          </div>
        </div>
        <div className='row'>
          <div className="col-md">
            <h3>Results</h3>
          </div>
        </div>
      </section>
    </Layout>
  );
}